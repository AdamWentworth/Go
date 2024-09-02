// updateOwnership.js

import { updatePokemonOwnership } from '../../components/Collect/PokemonOwnership/PokemonOwnershipUpdateService';

export const updateOwnership = (data, setData, ownershipDataRef) => (pokemonKeys, newStatus) => {
    const keys = Array.isArray(pokemonKeys) ? pokemonKeys : [pokemonKeys];
    const tempOwnershipData = { ...ownershipDataRef.current };
    let processedKeys = 0;

    const updates = new Map();
    console.log("Current Ownership Data as retrieved by updateOwnership:", ownershipDataRef.current);
    keys.forEach(key => {
        updatePokemonOwnership(key, newStatus, data.variants, tempOwnershipData, (fullKey) => {
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
                setData(prevData => ({
                    ...prevData,
                    ownershipData: tempOwnershipData
                }));

                // Update the ref
                ownershipDataRef.current = tempOwnershipData;

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
                            // If there are other instances, confirm deletion
                            delete tempOwnershipData[key]; // Delete the instance from temp ownership data
                        }
                    }
                });

                navigator.serviceWorker.ready.then(async registration => {
                    registration.active.postMessage({
                        action: 'syncData',
                        data: { data: tempOwnershipData, timestamp: Date.now() }
                    });

                    // Cache the updates for the service worker to pick up
                    const cache = await caches.open('pokemonCache');
                    const cachedUpdates = await cache.match('/batchedUpdates');
                    let updatesData = cachedUpdates ? await cachedUpdates.json() : {};

                    updates.forEach((value, key) => {
                        updatesData[key] = value;
                    });

                    await cache.put('/batchedUpdates', new Response(JSON.stringify(updatesData), {
                        headers: { 'Content-Type': 'application/json' }
                    }));
                });
            }
        });
    });
};
