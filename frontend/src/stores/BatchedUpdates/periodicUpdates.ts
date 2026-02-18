// periodicUpdates.ts
import { getBatchedPokemonUpdates, getBatchedTradeUpdates } from '../../db/indexedDB';
import { createScopedLogger } from '@/utils/logger';
import { getStoredLocation, getStoredUserRecord } from '@/utils/storage';
import type { Coordinates } from '@/types/location';

type Ref<T> = { current: T };
type LocationType = Coordinates | null;

const log = createScopedLogger('periodicUpdates');

function isUserLoggedIn(): boolean {
  const user = getStoredUserRecord();
  if (!user || typeof user.refreshTokenExpiry !== 'string') return false;
  const now = Date.now();
  const refreshExp = new Date(user.refreshTokenExpiry).getTime();
  // Consider logged in only if refresh token is still valid.
  return Number.isFinite(refreshExp) && refreshExp > now;
}

export const periodicUpdates = (
  scheduledSyncRef: Ref<boolean | null>,
  timerRef: Ref<NodeJS.Timeout | null>,
): (() => void) => {
  return () => {
    const location: LocationType = getStoredLocation();

    // Helper: schedule next check in 60s.
    const scheduleNext = (fn: () => void) => {
      log.debug('Setting another 60-second timer for the next update.');
      timerRef.current = setTimeout(fn, 60_000);
    };

    // Helper: ask service worker to send updates.
    const requestSend = () => {
      navigator.serviceWorker?.ready
        .then((registration) => {
          registration.active?.postMessage({
            action: 'sendBatchedUpdatesToBackend',
            data: location,
          });
          log.debug('Update request sent to service worker.');
        })
        .catch((error) => log.warn('Service worker not ready', error));
    };

    if (scheduledSyncRef.current == null) {
      log.debug('First call: triggering immediate update.');

      if (isUserLoggedIn()) {
        requestSend();
        scheduledSyncRef.current = true;

        // Begin periodic checks only while logged in.
        timerRef.current = setTimeout(async function sendUpdates() {
          log.debug('Timer expired: checking for batched updates in IndexedDB.');

          const [pokemonBatchedUpdates, tradeBatchedUpdates] = await Promise.all([
            getBatchedPokemonUpdates(),
            getBatchedTradeUpdates(),
          ]);

          const hasPokemonUpdates =
            Array.isArray(pokemonBatchedUpdates) && pokemonBatchedUpdates.length > 0;
          const hasTradeUpdates =
            Array.isArray(tradeBatchedUpdates) && tradeBatchedUpdates.length > 0;

          if (!hasPokemonUpdates && !hasTradeUpdates) {
            log.debug('No updates in IndexedDB: stopping periodic updates.');
            scheduledSyncRef.current = null;
            timerRef.current = null;
            return;
          }

          if (isUserLoggedIn()) {
            log.debug('Updates found in IndexedDB and user is logged in: sending to backend.');
            requestSend();
            scheduleNext(sendUpdates);
          } else {
            log.debug('Updates exist but user is not logged in: pausing periodic updates.');
            // Do not loop when logged out; pause until periodicUpdates() is called again.
            scheduledSyncRef.current = null;
            timerRef.current = null;
          }
        }, 60_000);
      } else {
        log.debug('Immediate update skipped (not logged in). Pausing periodic updates.');
        // Do not start the 60s loop when logged out.
        scheduledSyncRef.current = null;
        timerRef.current = null;
      }
    } else {
      log.debug('Function called again while waiting for timer to expire.');
    }
  };
};
