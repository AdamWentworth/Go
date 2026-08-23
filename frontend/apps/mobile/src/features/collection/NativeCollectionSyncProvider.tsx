import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';
import {
  AppState,
  type AppStateStatus,
} from 'react-native';
import {
  type PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { useNativeSession } from '../../auth/NativeSessionContext';
import { useNativeApiClients } from '../../services/useNativeApiClients';
import { nativeCollectionOutbox } from '../../storage/nativeCollectionOutbox';
import { logWarn } from '../../observability/logger';
import { nativeCollectionQueryKeys } from './collectionQueries';
import { sendPendingNativeCollectionBatches } from './collectionSyncCoordinator';

export const canAttemptNativeCollectionSync = (
  network: Pick<NetInfoState, 'isConnected' | 'isInternetReachable'>,
): boolean => network.isConnected !== false && network.isInternetReachable !== false;

export const shouldSyncForAppState = (state: AppStateStatus): boolean =>
  state === 'active';

export const NativeCollectionSyncProvider = ({ children }: PropsWithChildren) => {
  const session = useNativeSession();
  const clients = useNativeApiClients();
  const queryClient = useQueryClient();
  const inFlight = useRef<Promise<void> | null>(null);

  const flush = useCallback((): Promise<void> => {
    if (session.status !== 'signed-in' || !session.user) return Promise.resolve();
    if (inFlight.current) return inFlight.current;
    const userId = session.user.user_id;
    const operation = (async () => {
      const result = await sendPendingNativeCollectionBatches({
        userId,
        outbox: nativeCollectionOutbox,
        receiverClient: clients.receiver,
      });
      if (result.acknowledgedBatchIds.length > 0) {
        await queryClient.invalidateQueries({
          queryKey: nativeCollectionQueryKeys.snapshot(userId),
        });
      }
    })().catch((error: unknown) => {
      logWarn('collection-sync', 'Automatic collection sync failed', error);
    }).finally(() => {
      if (inFlight.current === operation) inFlight.current = null;
    });
    inFlight.current = operation;
    return operation;
  }, [clients.receiver, queryClient, session.status, session.user]);

  useEffect(() => {
    if (session.status !== 'signed-in' || !session.user) return undefined;
    void flush();
    const networkSubscription = NetInfo.addEventListener((network) => {
      if (canAttemptNativeCollectionSync(network)) void flush();
    });
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (shouldSyncForAppState(state)) void flush();
    });
    return () => {
      networkSubscription();
      appStateSubscription.remove();
    };
  }, [flush, session.status, session.user]);

  return children;
};
