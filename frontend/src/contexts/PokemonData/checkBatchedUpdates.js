// checkBatchedUpdates.js

export const checkBatchedUpdates = async (periodicUpdates) => {
    try {
        const cache = await caches.open('pokemonCache');
        const response = await cache.match('/batchedUpdates');
        if (response) {
            console.log("Batched updates found in cache: Triggering periodic updates.");
            periodicUpdates();
        } else {
            console.log("No batched updates found in cache.");
        }
    } catch (error) {
        console.error("Failed to check for batched updates in cache:", error);
    }
};
