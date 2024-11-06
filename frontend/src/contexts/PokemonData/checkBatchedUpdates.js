// checkBatchedUpdates.js

import { getBatchedUpdates } from '../../services/indexedDBConfig';

export const checkBatchedUpdates = async (periodicUpdates) => {
    try {
        const batchedUpdates = await getBatchedUpdates();
        if (batchedUpdates && batchedUpdates.length > 0) {
            console.log("Batched updates found in IndexedDB: Triggering periodic updates.");
            periodicUpdates();
        } else {
            console.log("No batched updates found in IndexedDB.");
        }
    } catch (error) {
        console.error("Failed to check for batched updates in IndexedDB:", error);
    }
};
