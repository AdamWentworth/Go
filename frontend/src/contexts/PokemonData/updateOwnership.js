// updateOwnership.js

import { updatePokemonOwnership } from '../../components/Collect/PokemonOwnership/PokemonOwnershipUpdateService';

export const updateOwnership = (data, setData, ownershipDataRef, updateLists, isInitialSyncScheduled, timerValue) => (pokemonKeys, newStatus) => {
    const keys = Array.isArray(pokemonKeys) ? pokemonKeys : [pokemonKeys];
    const tempOwnershipData = { ...ownershipDataRef.current };
    let processedKeys = 0;

    const updates = new Map();
    console.log("Current Ownership Data as retrieved by updateOwnership:", ownershipDataRef.current);
    console.log("Keys to be processed:", keys);

    keys.forEach(key => {
        console.log(`Processing key: ${key}`);
        updatePokemonOwnership(key, newStatus, data.variants, tempOwnershipData, (fullKey) => {
            processedKeys++;
            const currentTimestamp = Date.now();
            console.log(`updatePokemonOwnership callback for key: ${fullKey} at ${currentTimestamp}`);

            if (fullKey) {
                if (tempOwnershipData[fullKey]) {
                    console.log(`Updating tempOwnershipData for key: ${fullKey} with new status at ${currentTimestamp}`);
                    updates.set(fullKey, { ...tempOwnershipData[fullKey], last_update: currentTimestamp });
                } else {
                    console.warn(`Key ${fullKey} has no data in tempOwnershipData, adding new entry with timestamp ${currentTimestamp}`);
                    updates.set(fullKey, { last_update: currentTimestamp });
                }
            }

            if (processedKeys === keys.length) { // Only update state and SW when all keys are processed
                console.log(`All keys processed. Updating state and service worker with tempOwnershipData:`, tempOwnershipData);

                setData(prevData => ({
                    ...prevData,
                    ownershipData: tempOwnershipData
                }));

                // Update the ref
                ownershipDataRef.current = tempOwnershipData;
                console.log("Updated ownershipDataRef:", ownershipDataRef.current);

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
                            console.log(`Deleting key ${key} from tempOwnershipData as it is not the only instance.`);
                            delete tempOwnershipData[key]; // Delete the instance from temp ownership data
                        }
                    }
                });

                navigator.serviceWorker.ready.then(async registration => {
                    console.log("Service worker is ready. Sending data to service worker.");
                    registration.active.postMessage({
                        action: 'syncData',
                        data: { data: tempOwnershipData, timestamp: Date.now() }
                    });

                    // Cache the updates for the service worker to pick up
                    const cache = await caches.open('pokemonCache');
                    const cachedUpdates = await cache.match('/batchedUpdates');
                    let updatesData = cachedUpdates ? await cachedUpdates.json() : {};

                    updates.forEach((value, key) => {
                        console.log(`Caching update for key: ${key}`, value);
                        updatesData[key] = value;
                    });

                    await cache.put('/batchedUpdates', new Response(JSON.stringify(updatesData), {
                        headers: { 'Content-Type': 'application/json' }
                    }));

                    console.log("Cached updates:", updatesData);
                });
            }
        });
    });
};
