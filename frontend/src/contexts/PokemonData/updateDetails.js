// updateDetails.js

import { updatePokemonDetails } from '../../features/Collect/PokemonOwnership/pokemonOwnershipManager';
import { putBatchedUpdates } from '../../services/indexedDB';

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
        data: { data: newData, timestamp: Date.now() }
    });

    // Update ownershipTimestamp in localStorage
    localStorage.setItem('ownershipTimestamp', currentTimestamp.toString());

    // Use IndexedDB to cache the batched updates
    for (const pokemonKey of keysArray) {
        await putBatchedUpdates(pokemonKey, newData[pokemonKey]);
    }
};