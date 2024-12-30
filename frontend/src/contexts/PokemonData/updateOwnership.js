// updateOwnership.js

import { updatePokemonOwnership } from '../../features/Collect/PokemonOwnership/PokemonOwnershipUpdateService';
import { putBatchedPokemonUpdates } from '../../services/indexedDB';

export const updateOwnership = (data, setData, ownershipDataRef, lists) => (pokemonKeys, newStatus) => {
    const keys = Array.isArray(pokemonKeys) ? pokemonKeys : [pokemonKeys];
    const tempOwnershipData = { ...ownershipDataRef.current };
    let processedKeys = 0;

    const updates = new Map();
    // console.log("Current Ownership Data as retrieved by updateOwnership:", ownershipDataRef.current);

    keys.forEach(key => {
        updatePokemonOwnership(key, newStatus, data.variants, tempOwnershipData, lists, (fullKey) => {
            processedKeys++;
            const currentTimestamp = Date.now();
            if (fullKey) {
                if (tempOwnershipData[fullKey]) {
                    updates.set(fullKey, { ...tempOwnershipData[fullKey], last_update: currentTimestamp });
                } else {
                    console.warn(`Key ${fullKey} has no data in tempOwnershipData`);
                    updates.set(fullKey, { last_update: currentTimestamp });
                }
            }

            if (processedKeys === keys.length) { // Only update state and SW when all keys are processed
                console.log(`All keys processed. Updating state and service worker.`);

                // Update state with new ownership data and lists
                setData(prevData => ({
                    ...prevData,
                    ownershipData: tempOwnershipData,
                    lists: { ...lists }  // Include updated lists in state
                }));

                // Update the ref
                ownershipDataRef.current = tempOwnershipData;

                // Clean up any unnecessary instances in the ownership data
                keys.forEach(key => {
                    if (tempOwnershipData[key] &&
                        tempOwnershipData[key].is_unowned === true &&
                        tempOwnershipData[key].is_owned === false &&
                        tempOwnershipData[key].is_for_trade === false &&
                        tempOwnershipData[key].is_wanted === false) {

                        let keyParts = key.split('_');
                        keyParts.pop(); // Remove the UUID part
                        let basePrefix = keyParts.join('_'); // Rejoin to form the actual prefix

                        let relatedInstances = Object.keys(tempOwnershipData).filter(k => {
                            let parts = k.split('_');
                            parts.pop(); // Remove the UUID part
                            let currentPrefix = parts.join('_');
                            return currentPrefix === basePrefix && k !== key;
                        });

                        let isOnlyInstance = relatedInstances.length === 0; // Check if there are no other related instances

                        if (!isOnlyInstance) {
                            delete tempOwnershipData[key]; // Delete the instance from temp ownership data
                        }
                    }
                });

                // Sync updated data with service worker
                navigator.serviceWorker.ready.then(async registration => {
                    registration.active.postMessage({
                        action: 'syncData',
                        data: { data: tempOwnershipData, timestamp: Date.now() }
                    });

                    // Update ownershipTimestamp in localStorage
                    localStorage.setItem('ownershipTimestamp', currentTimestamp.toString());

                    // Store each update in IndexedDB
                    updates.forEach(async (value, key) => {
                        await putBatchedPokemonUpdates(key, value);
                    });
                });
            }
        });
    });
};
