import { useEffect, useRef } from 'react';

import { reconcileInstancesFromServer } from '../services/reconcileInstances';
import { useInstancesStore } from '../store/useInstancesStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePokemonSyncStore } from '@/stores/usePokemonSyncStore';
import { createScopedLogger } from '@/utils/logger';
import {
  getAcknowledgedPokemonUpdates,
  getBatchedPokemonUpdates,
} from '@/db/indexedDB';

const log = createScopedLogger('instanceReconciliation');
const RECONCILE_INTERVAL_MS = 5 * 60_000;

async function refreshPokemonSyncQueueStatus() {
  const [pending, acknowledged] = await Promise.all([
    getBatchedPokemonUpdates(),
    getAcknowledgedPokemonUpdates(),
  ]);
  usePokemonSyncStore.getState().updateQueueStatus(
    pending.length + acknowledged.length,
    acknowledged.length ? 'reconciling' : 'idle',
  );
}

export function useInstanceReconciliation(enabled = true) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const instancesLoading = useInstancesStore((state) => state.instancesLoading);
  const running = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    const refreshPendingCount = () => void refreshPokemonSyncQueueStatus();
    refreshPendingCount();
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type !== 'POKEMON_SYNC_STATUS') return;
      const payload = event.data.payload ?? {};
      usePokemonSyncStore.getState().updateQueueStatus(
        Number(payload.pendingCount ?? 0),
        payload.status === 'sending' ||
        payload.status === 'reconciling' ||
        payload.status === 'error'
          ? payload.status
          : 'idle',
        typeof payload.error === 'string' ? payload.error : undefined,
      );
    };
    navigator.serviceWorker?.addEventListener('message', onMessage);
    window.addEventListener('pokemon-sync-queue-changed', refreshPendingCount);
    return () => {
      navigator.serviceWorker?.removeEventListener('message', onMessage);
      window.removeEventListener('pokemon-sync-queue-changed', refreshPendingCount);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !isLoggedIn || instancesLoading) return;

    const reconcile = async () => {
      if (running.current || !navigator.onLine) return;
      running.current = true;
      usePokemonSyncStore.getState().markReconciling();
      try {
        await reconcileInstancesFromServer();
        usePokemonSyncStore.getState().markReconciled();
        await refreshPokemonSyncQueueStatus();
      } catch (error) {
        log.warn('Background reconciliation failed', error);
        usePokemonSyncStore.getState().markReconcileFailed(error);
      } finally {
        running.current = false;
      }
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') void reconcile();
    };
    const onRequested = () => void reconcile();
    void reconcile();
    const timer = window.setInterval(() => void reconcile(), RECONCILE_INTERVAL_MS);
    window.addEventListener('online', reconcile);
    window.addEventListener('pokemon-sync-reconcile-requested', onRequested);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('online', reconcile);
      window.removeEventListener('pokemon-sync-reconcile-requested', onRequested);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [enabled, instancesLoading, isLoggedIn]);
}
