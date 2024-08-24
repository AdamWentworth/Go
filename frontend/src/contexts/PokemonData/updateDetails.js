// updateDetails.js

import { updatePokemonDetails } from '../../components/Collect/PokemonOwnership/pokemonOwnershipManager';

export const updateDetails = (
    data,
    setData,
    updateLists
) => async (pokemonKeys, details) => {
    // Ensure pokemonKeys is an array
    const keysArray = Array.isArray(pokemonKeys) ? pokemonKeys : [pokemonKeys];

    // Prepare new ownership data and timestamp
    const newData = { ...data.ownershipData };
    const currentTimestamp = Date.now();

    // Update details for each Pokémon key
    keysArray.forEach((pokemonKey) => {
        updatePokemonDetails(pokemonKey, details, data.ownershipData);
        newData[pokemonKey] = { ...newData[pokemonKey], ...details, last_update: currentTimestamp };
    });

    // Update the ownership data in context state once after all updates
    setData(prevData => ({
        ...prevData,
        ownershipData: newData
    }));

    // Sync the updated data to the service worker once
    navigator.serviceWorker.ready.then(registration => {
        registration.active.postMessage({
            action: 'syncData',
            data: { data: newData, timestamp: currentTimestamp }
        });
    });

    // Cache the updates once
    caches.open('pokemonCache').then(async cache => {
        const cachedUpdates = await cache.match('/batchedUpdates');
        let updatesData = cachedUpdates ? await cachedUpdates.json() : {};

        // Add each updated Pokémon key to the cache
        keysArray.forEach((pokemonKey) => {
            updatesData[pokemonKey] = newData[pokemonKey];
        });

        await cache.put('/batchedUpdates', new Response(JSON.stringify(updatesData), {
            headers: { 'Content-Type': 'application/json' }
        }));
    });

    // Call updateLists after all syncing and caching is complete
    updateLists();
};