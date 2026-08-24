import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { NativeCollectionSnapshot } from '../../services/collectionApi';
import { useNativeApiClients } from '../../services/useNativeApiClients';
import { nativeCollectionOutbox } from '../../storage/nativeCollectionOutbox';
import { useNativeCollectionSync } from './NativeCollectionSyncProvider';
import { nativeCollectionQueryKeys } from './collectionQueries';
import {
  persistNativeCatalogAdditions,
  type NativeCatalogOrganizerRequest,
} from './nativeCatalogMutation';

export const useNativeCatalogOrganizerMutation = (userId: string) => {
  const clients = useNativeApiClients();
  const queryClient = useQueryClient();
  const sync = useNativeCollectionSync();
  return useMutation({
    mutationFn: async (request: NativeCatalogOrganizerRequest) => {
      const queryKey = nativeCollectionQueryKeys.snapshot(userId);
      const snapshot = queryClient.getQueryData<NativeCollectionSnapshot>(queryKey);
      if (!snapshot) throw new Error('Load your collection before adding Pokémon.');
      const result = await persistNativeCatalogAdditions({
        userId,
        snapshot,
        request,
        outbox: nativeCollectionOutbox,
        receiverClient: clients.receiver,
        onQueued: (instances) => {
          queryClient.setQueryData<NativeCollectionSnapshot>(queryKey, (current) => {
            if (!current) return current;
            const additions = Object.fromEntries(instances.flatMap((instance) => (
              instance.instance_id ? [[instance.instance_id, instance]] : []
            )));
            return { ...current, instances: { ...current.instances, ...additions } };
          });
        },
      });
      await queryClient.invalidateQueries({ queryKey });
      await sync.refreshStatus();
      return result;
    },
  });
};
