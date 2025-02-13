// updateOwnership.js

import { updatePokemonOwnership } from '../../features/Collection/PokemonOwnership/PokemonOwnershipUpdateService';
import { putBatchedPokemonUpdates } from '../../services/indexedDB';

export const updateOwnership = (data, setData, ownershipDataRef, lists) => async (pokemonKeys, newStatus) => {
    const keys = Array.isArray(pokemonKeys) ? pokemonKeys : [pokemonKeys];
    const tempOwnershipData = { ...ownershipDataRef.current };

    const updates = new Map();
    let currentTimestamp = Date.now(); // Initialize timestamp here to have a consistent value

    // console.log("Current Ownership Data as retrieved by updateOwnership:", ownershipDataRef.current);

    for (const key of keys) {
        const fullKey = await updatePokemonOwnership(key, newStatus, data.variants, tempOwnershipData, lists);
        // Update timestamp for each processed key if needed
        currentTimestamp = Date.now();
        if (fullKey) {
            if (tempOwnershipData[fullKey]) {
                updates.set(fullKey, { ...tempOwnershipData[fullKey], last_update: currentTimestamp });
            } else {
                console.warn(`Key ${fullKey} has no data in tempOwnershipData`);
                updates.set(fullKey, { last_update: currentTimestamp });
            }
        }
    }

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
    try {
        const registration = await navigator.serviceWorker.ready;
        await registration.active.postMessage({
            action: 'syncData',
            data: { data: tempOwnershipData, timestamp: currentTimestamp }
        });

        // Update ownershipTimestamp in localStorage
        localStorage.setItem('ownershipTimestamp', currentTimestamp.toString());

        // Store each update in IndexedDB
        for (const [key, value] of updates.entries()) {
            await putBatchedPokemonUpdates(key, value);
        }
    } catch (error) {
        console.error("Error syncing with service worker or IndexedDB:", error);
    }
};
