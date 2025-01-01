// updateDetails.js

import { putBatchedPokemonUpdates } from '../../services/indexedDB';

export const updateDetails = (
    data,
    setData
) => async (pokemonKeys, details) => {

    // Function to update individual details of a Pokemon instance
    function updatePokemonDetails(pokemonKey, details, ownershipData) {
        if (ownershipData && ownershipData[pokemonKey]) {
            // Apply the new details to the specific entry
            ownershipData[pokemonKey] = { ...ownershipData[pokemonKey], ...details };
            console.log(`Details updated for ${pokemonKey}:`, ownershipData[pokemonKey]);
        } else {
            console.error("No data found for the specified key:", pokemonKey);
        }
    }

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

        // Call the integrated updatePokemonDetails function
        updatePokemonDetails(pokemonKey, specificDetails, data.ownershipData);
        newData[pokemonKey] = { ...newData[pokemonKey], ...specificDetails, last_update: currentTimestamp };
    });

    // Update the ownership data in context state once after all updates
    setData(prevData => ({
        ...prevData,
        ownershipData: newData
    }));

    try {
        // Sync the updated data to the service worker once
        const registration = await navigator.serviceWorker.ready;
        registration.active.postMessage({
            action: 'syncData',
            data: { data: newData, timestamp: Date.now() }
        });
    } catch (error) {
        console.error("Service Worker synchronization failed:", error);
    }

    // Update ownershipTimestamp in localStorage
    localStorage.setItem('ownershipTimestamp', currentTimestamp.toString());

    console.log('Ownership details updated successfully.');

    // Use IndexedDB to cache the batched updates
    for (const pokemonKey of keysArray) {
        try {
            await putBatchedPokemonUpdates(pokemonKey, newData[pokemonKey]);
        } catch (error) {
            console.error(`Failed to cache updates for ${pokemonKey}:`, error);
        }
    }
};
