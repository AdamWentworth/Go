// periodicUpdates.js

import { getBatchedUpdates } from '../../services/indexedDB';

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

            // First call, trigger the immediate update
            navigator.serviceWorker.ready.then(registration => {
                registration.active.postMessage({
                    action: 'sendBatchedUpdatesToBackend',
                    data: location || null,
                });
                console.log("Immediate update sent to backend.");
            });
            scheduledSyncRef.current = true;

            // Set a 60-second timer to handle future batched updates
            console.log("Setting 60-second timer for future batched updates.");
            timerRef.current = setTimeout(async function sendUpdates() {
                console.log("Timer expired: Checking for batched updates in IndexedDB.");

                const batchedUpdates = await getBatchedUpdates();

                if (!batchedUpdates || batchedUpdates.length === 0) {
                    // If IndexedDB is empty, stop periodic updates
                    console.log("No updates in IndexedDB: Stopping periodic updates.");
                    scheduledSyncRef.current = null;
                    timerRef.current = null;
                } else {
                    // Updates exist in IndexedDB, proceed with syncing
                    console.log("Updates found in IndexedDB: Sending batched updates to backend.");
                    navigator.serviceWorker.ready.then(registration => {
                        registration.active.postMessage({
                            action: 'sendBatchedUpdatesToBackend',
                            data: location || null,
                        });
                    });

                    // Set the next 60-second timer for the next update
                    console.log("Setting another 60-second timer for the next update.");
                    timerRef.current = setTimeout(sendUpdates, 60000);
                }
            }, 60000);
        } else {
            console.log("Function called again but is currently waiting for the timer to expire.");
        }
    };
};
