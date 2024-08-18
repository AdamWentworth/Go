// updateDetails.js

import { updatePokemonDetails } from '../../components/Collect/PokemonOwnership/pokemonOwnershipManager';

export const updateDetails = (
    data,
    setData,
    updateLists
) => async (pokemonKey, details) => {
    updatePokemonDetails(pokemonKey, details, data.ownershipData);

    // Update the context state with new details and timestamp
    const newData = { ...data.ownershipData };
    const currentTimestamp = Date.now();
    newData[pokemonKey] = { ...newData[pokemonKey], ...details, last_update: currentTimestamp };

    setData(prevData => ({
        ...prevData,
        ownershipData: newData
    }));

    const registration = await navigator.serviceWorker.ready;
    
    // Sync the updated data to the service worker
    registration.active.postMessage({
        action: 'syncData',
        data: { data: newData, timestamp: Date.now() }
    });

    // Cache the updates
    const cache = await caches.open('pokemonCache');
    const cachedUpdates = await cache.match('/batchedUpdates');
    let updatesData = cachedUpdates ? await cachedUpdates.json() : {};

    updatesData[pokemonKey] = newData[pokemonKey];

    await cache.put('/batchedUpdates', new Response(JSON.stringify(updatesData), {
        headers: { 'Content-Type': 'application/json' }
    }));

    // Call updateLists after syncing is complete
    updateLists();
};
