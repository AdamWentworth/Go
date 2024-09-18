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
        // If details is an object keyed by pokemonKey, use the specific details for that key
        const specificDetails = Array.isArray(pokemonKeys) && typeof details === 'object' && !Array.isArray(details) 
            ? details[pokemonKey] || {} 
            : details;

        updatePokemonDetails(pokemonKey, specificDetails, data.ownershipData);
        newData[pokemonKey] = { ...newData[pokemonKey], ...specificDetails, last_update: currentTimestamp };
    });

    // Update the ownership data in context state once after all updates
    setData(prevData => ({
        ...prevData,
        ownershipData: newData
    }));

    // Sync the updated data to the service worker once
    const registration = await navigator.serviceWorker.ready;
    registration.active.postMessage({
        action: 'syncData',
        data: { data: newData, timestamp: currentTimestamp }
    });

    // Cache the updates once
    const cache = await caches.open('pokemonCache');
    const cachedUpdatesResponse = await cache.match('/batchedUpdates');
    let updatesData = cachedUpdatesResponse ? await cachedUpdatesResponse.json() : {};

    // Add each updated Pokémon key to the cache
    keysArray.forEach((pokemonKey) => {
        updatesData[pokemonKey] = newData[pokemonKey];
    });

    await cache.put('/batchedUpdates', new Response(JSON.stringify(updatesData), {
        headers: { 'Content-Type': 'application/json' }
    }));

    // Optionally, call updateLists if needed
    // updateLists();
};
