// updateDetails.js
import { putBatchedPokemonUpdates } from '../../services/indexedDB';

export const updateDetails = (data, setData) => async (keysOrObject, details) => {
  // Helper to update or create details for one key
  function updateOnePokemonDetails(pokemonKey, partialDetails, ownershipData, ts) {
    if (!ownershipData[pokemonKey]) {
      console.warn(`No existing data found for "${pokemonKey}". Creating new entry...`);
      ownershipData[pokemonKey] = {};
    }
    // Merge details
    ownershipData[pokemonKey] = {
      ...ownershipData[pokemonKey],
      ...partialDetails,
      last_update: ts, // always update last_update
    };
    console.log(`Details updated for ${pokemonKey}:`, ownershipData[pokemonKey]);
  }

  // Clone current ownership data and prepare a timestamp
  const newData = { ...data.ownershipData };
  const currentTimestamp = Date.now();

  /**
   * CASE A: The *new* usage
   *    If the caller passes an object with no second arg, e.g.:
   *    updateDetails({
   *      key1: { fieldA: valA },
   *      key2: { fieldB: valB },
   *    });
   */
  if (
    typeof keysOrObject === 'object' &&
    keysOrObject !== null &&
    !Array.isArray(keysOrObject) &&
    details === undefined
  ) {
    // We interpret `keysOrObject` as { key1: details1, key2: details2 }
    Object.entries(keysOrObject).forEach(([pokemonKey, detailObj]) => {
      updateOnePokemonDetails(pokemonKey, detailObj, newData, currentTimestamp);
    });
  }

  /**
   * CASE B: The *existing* usage
   *    1) Single key + single details object
   *       updateDetails("someKey", { cp: 100 })
   *    2) Array of keys + single details object
   *       updateDetails(["key1", "key2"], { disabled: true })
   */
  else {
    // Convert single key => array
    const keysArray = Array.isArray(keysOrObject) ? keysOrObject : [keysOrObject];

    keysArray.forEach((pokemonKey) => {
      let specificDetails = details;
      // If the caller has an array of keys and an object of sub-details keyed by each key,
      // we can support that too. (But if you're not doing that pattern, you can remove this logic.)
      if (Array.isArray(keysOrObject) && typeof details === 'object' && !Array.isArray(details)) {
        specificDetails = details[pokemonKey] || {};
      }

      updateOnePokemonDetails(pokemonKey, specificDetails, newData, currentTimestamp);
    });
  }

  // Now update the state
  setData((prevData) => ({
    ...prevData,
    ownershipData: newData,
  }));

  // Attempt to sync with Service Worker
  try {
    const registration = await navigator.serviceWorker.ready;
    registration.active.postMessage({
      action: 'syncData',
      data: { data: newData, timestamp: currentTimestamp },
    });
  } catch (error) {
    console.error('Service Worker synchronization failed:', error);
  }

  // Update ownershipTimestamp
  localStorage.setItem('ownershipTimestamp', currentTimestamp.toString());

  console.log('Ownership details updated successfully.');

  // Persist in IndexedDB for each changed key
  // Build a list of the keys we actually updated:
  let updatedKeys = [];
  if (
    typeof keysOrObject === 'object' &&
    keysOrObject !== null &&
    !Array.isArray(keysOrObject) &&
    details === undefined
  ) {
    // We used the new usage => object with multiple keys
    updatedKeys = Object.keys(keysOrObject);
  } else {
    // Old usage => single or multiple keys
    updatedKeys = Array.isArray(keysOrObject) ? keysOrObject : [keysOrObject];
  }

  for (const pokemonKey of updatedKeys) {
    try {
      await putBatchedPokemonUpdates(pokemonKey, newData[pokemonKey]);
    } catch (err) {
      console.error(`Failed to cache updates for ${pokemonKey}:`, err);
    }
  }
};
