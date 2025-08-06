// periodicUpdates.ts
import { getBatchedPokemonUpdates, getBatchedTradeUpdates } from '../../db/indexedDB';

type Ref<T> = { current: T };
type LocationType = {
  latitude: number;
  longitude: number;
  [key: string]: unknown;
} | null;

function isUserLoggedIn(): boolean {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return false;
    const user = JSON.parse(raw);
    const now = Date.now();
    const refreshExp = new Date(user.refreshTokenExpiry).getTime();
    // Consider logged in only if refresh token is still valid
    return Number.isFinite(refreshExp) && refreshExp > now;
  } catch {
    return false;
  }
}

export const periodicUpdates = (
  scheduledSyncRef: Ref<boolean | null>,
  timerRef: Ref<NodeJS.Timeout | null>
): (() => void) => {
  return () => {
    const storedLocation = localStorage.getItem('location');
    let location: LocationType = null;

    if (storedLocation) {
      try {
        location = JSON.parse(storedLocation);
      } catch (e) {
        console.warn('Failed to parse stored location:', e);
      }
    }

    // Helper: schedule next check in 60s
    const scheduleNext = (fn: () => void) => {
      console.log('Setting another 60-second timer for the next update.');
      timerRef.current = setTimeout(fn, 60_000);
    };

    // Helper: ask SW to send updates
    const requestSend = () => {
      navigator.serviceWorker?.ready
        .then((registration) => {
          registration.active?.postMessage({
            action: 'sendBatchedUpdatesToBackend',
            data: location,
          });
          console.log('Update request sent to service worker.');
        })
        .catch((e) => console.warn('Service worker not ready:', e));
    };

    if (scheduledSyncRef.current == null) {
      console.log('First call: Triggering immediate update.');

      if (isUserLoggedIn()) {
        requestSend();
        scheduledSyncRef.current = true;

        // Begin periodic checks only while logged in
        timerRef.current = setTimeout(async function sendUpdates() {
          console.log('Timer expired: Checking for batched updates in IndexedDB.');

          const [pokemonBatchedUpdates, tradeBatchedUpdates] = await Promise.all([
            getBatchedPokemonUpdates(),
            getBatchedTradeUpdates(),
          ]);

          const hasPokemonUpdates =
            Array.isArray(pokemonBatchedUpdates) && pokemonBatchedUpdates.length > 0;
          const hasTradeUpdates =
            Array.isArray(tradeBatchedUpdates) && tradeBatchedUpdates.length > 0;

          if (!hasPokemonUpdates && !hasTradeUpdates) {
            console.log('No updates in IndexedDB: Stopping periodic updates.');
            scheduledSyncRef.current = null;
            timerRef.current = null;
            return;
          }

          if (isUserLoggedIn()) {
            console.log('Updates found in IndexedDB and user is logged in: sending to backend.');
            requestSend();
            scheduleNext(sendUpdates);
          } else {
            console.log(
              'Updates exist but user is not logged in: skipping send and pausing periodic updates.'
            );
            // 🛑 Do NOT loop when logged out; pause until the app calls periodicUpdates() again (e.g., on login or next user action)
            scheduledSyncRef.current = null;
            timerRef.current = null;
          }
        }, 60_000);
      } else {
        console.log('Immediate update skipped (not logged in). Pausing periodic updates.');
        // Do NOT start the 60s loop when logged out.
        scheduledSyncRef.current = null;
        timerRef.current = null;
      }
    } else {
      console.log('Function called again but is currently waiting for the timer to expire.');
    }
  };
};
