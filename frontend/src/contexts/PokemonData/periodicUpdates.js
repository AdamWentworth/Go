// periodicUpdates.js

import {
    getBatchedPokemonUpdates,
    getBatchedTradeUpdates
} from '../../services/indexedDB';

export const periodicUpdates = (scheduledSyncRef, timerRef) => {
    return () => {
        // Retrieve the location from localStorage
        const storedLocation = localStorage.getItem('location');
        let location = null;
        if (storedLocation) {
            location = JSON.parse(storedLocation);
        }

        if (scheduledSyncRef.current == null) {
            console.log("First call: Triggering immediate update.");

            // Trigger the immediate update
            navigator.serviceWorker.ready.then((registration) => {
                registration.active.postMessage({
                    action: 'sendBatchedUpdatesToBackend',
                    data: location || null,
                });
                console.log("Immediate update sent to backend.");
            });

            // Mark that we've scheduled a sync and start the timer
            scheduledSyncRef.current = true;

            console.log("Setting 60-second timer for future batched updates.");
            timerRef.current = setTimeout(async function sendUpdates() {
                console.log("Timer expired: Checking for batched updates in IndexedDB.");

                // Fetch both Pokémon and Trade updates
                const [pokemonBatchedUpdates, tradeBatchedUpdates] = await Promise.all([
                    getBatchedPokemonUpdates(),
                    getBatchedTradeUpdates(),
                ]);

                const hasPokemonUpdates = pokemonBatchedUpdates && pokemonBatchedUpdates.length > 0;
                const hasTradeUpdates   = tradeBatchedUpdates && tradeBatchedUpdates.length > 0;

                if (!hasPokemonUpdates && !hasTradeUpdates) {
                    // If **both** are empty, stop checking
                    console.log("No updates in IndexedDB: Stopping periodic updates.");
                    scheduledSyncRef.current = null;
                    timerRef.current = null;
                } else {
                    // Updates exist in IndexedDB, proceed with syncing
                    console.log("Updates found in IndexedDB: Sending batched updates to backend.");
                    navigator.serviceWorker.ready.then((registration) => {
                        registration.active.postMessage({
                            action: 'sendBatchedUpdatesToBackend',
                            data: location || null,
                        });
                    });

                    // Reset the 60-second timer for next sync
                    console.log("Setting another 60-second timer for the next update.");
                    timerRef.current = setTimeout(sendUpdates, 60000);
                }
            }, 60000);

        } else {
            console.log("Function called again but is currently waiting for the timer to expire.");
        }
    };
};
