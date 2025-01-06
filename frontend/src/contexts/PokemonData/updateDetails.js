// updateDetails.js

import { putBatchedPokemonUpdates } from '../../services/indexedDB';

export const updateDetails = (data, setData) => async (pokemonKeys, details) => {
  // Function to update or create details of a Pokémon instance
  function updatePokemonDetails(pokemonKey, details, ownershipData) {
    // If this key doesn't exist, initialize it
    if (!ownershipData[pokemonKey]) {
      console.warn(`No existing data found for "${pokemonKey}". Creating a new entry...`);
      ownershipData[pokemonKey] = {};
    }

    // Apply the new details to the specific entry
    ownershipData[pokemonKey] = { ...ownershipData[pokemonKey], ...details };
    console.log(`Details updated (or created) for ${pokemonKey}:`, ownershipData[pokemonKey]);
  }

  // Ensure pokemonKeys is an array
  const keysArray = Array.isArray(pokemonKeys) ? pokemonKeys : [pokemonKeys];

  // Clone current ownership data and prepare a timestamp
  const newData = { ...data.ownershipData };
  const currentTimestamp = Date.now();

  // Update details for each Pokémon key
  keysArray.forEach((pokemonKey) => {
    // If we’re updating multiple Pokémon at once and `details` might be an object of objects,
    // we grab the portion relevant to this particular `pokemonKey`
    const specificDetails = Array.isArray(pokemonKeys) && typeof details === 'object' && !Array.isArray(details)
      ? details[pokemonKey] || {}
      : details;

    // Update (or create) the Pokémon details
    updatePokemonDetails(pokemonKey, specificDetails, newData);

    // Always refresh last_update
    newData[pokemonKey] = {
      ...newData[pokemonKey],
      last_update: currentTimestamp,
    };
  });

  // Now update the context state in a single pass
  setData((prevData) => ({
    ...prevData,
    ownershipData: newData,
  }));

  // Attempt to sync with Service Worker
  try {
    const registration = await navigator.serviceWorker.ready;
    registration.active.postMessage({
      action: 'syncData',
      data: { data: newData, timestamp: Date.now() },
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
