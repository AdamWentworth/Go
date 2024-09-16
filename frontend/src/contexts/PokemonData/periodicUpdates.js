// periodicUpdates.js

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
            timerRef.current = setTimeout(function sendUpdates() {
                console.log("Timer expired: Checking for batched updates in cache.");

                caches.open('pokemonCache').then(cache => {
                    cache.match('/batchedUpdates').then(response => {
                        if (!response) {
                            // If cache is empty, stop periodic updates
                            console.log("No updates in cache: Stopping periodic updates.");
                            scheduledSyncRef.current = null;
                            timerRef.current = null;
                        } else {
                            // Cache is not empty, send batched updates
                            console.log("Updates found in cache: Sending batched updates to backend.");
                            navigator.serviceWorker.ready.then(registration => {
                                response.json().then(batchedUpdates => {
                                    // Send the location to the service worker
                                    registration.active.postMessage({
                                        action: 'sendBatchedUpdatesToBackend',
                                        data: location || null,
                                    });
                                });
                            });

                            // Set the next 60-second timer for the next update
                            console.log("Setting another 60-second timer for the next update.");
                            timerRef.current = setTimeout(sendUpdates, 60000);
                        }
                    });
                });
            }, 60000);

        } else {
            console.log("Function called again but is currently waiting for the timer to expire.");
        }
    };
};