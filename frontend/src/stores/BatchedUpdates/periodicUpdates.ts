// periodicUpdates.ts

import { getBatchedPokemonUpdates, getBatchedTradeUpdates } from '../../db/indexedDB';

type Ref<T> = { current: T };
type LocationType = {
  latitude: number;
  longitude: number;
  [key: string]: unknown; // or omit this line if those two fields are enough
} | null;

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

    if (scheduledSyncRef.current == null) {
      console.log('First call: Triggering immediate update.');

      navigator.serviceWorker.ready.then((registration) => {
        registration.active?.postMessage({
          action: 'sendBatchedUpdatesToBackend',
          data: location,
        });
        console.log('Immediate update sent to backend.');
      });

      scheduledSyncRef.current = true;

      console.log('Setting 60-second timer for future batched updates.');
      timerRef.current = setTimeout(async function sendUpdates() {
        console.log('Timer expired: Checking for batched updates in IndexedDB.');

        const [pokemonBatchedUpdates, tradeBatchedUpdates] = await Promise.all([
          getBatchedPokemonUpdates(),
          getBatchedTradeUpdates(),
        ]);

        const hasPokemonUpdates = Array.isArray(pokemonBatchedUpdates) && pokemonBatchedUpdates.length > 0;
        const hasTradeUpdates = Array.isArray(tradeBatchedUpdates) && tradeBatchedUpdates.length > 0;

        if (!hasPokemonUpdates && !hasTradeUpdates) {
          console.log('No updates in IndexedDB: Stopping periodic updates.');
          scheduledSyncRef.current = null;
          timerRef.current = null;
        } else {
          console.log('Updates found in IndexedDB: Sending batched updates to backend.');
          navigator.serviceWorker.ready.then((registration) => {
            registration.active?.postMessage({
              action: 'sendBatchedUpdatesToBackend',
              data: location,
            });
          });

          console.log('Setting another 60-second timer for the next update.');
          timerRef.current = setTimeout(sendUpdates, 60000);
        }
      }, 60000);
    } else {
      console.log('Function called again but is currently waiting for the timer to expire.');
    }
  };
};
