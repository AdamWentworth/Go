// pokemonStorageManager.js

import { getAllFromDB, putBulkIntoDB, clearStore } from '../../../services/indexedDB';
import { generateUUID, validateUUID } from '../../../utils/PokemonIDUtils';
import { createNewDataForVariant } from './pokemonOwnershipManager';

export async function getOwnershipDataAsync() {
    // Get all ownership data from IndexedDB
    const startGetOwnership = Date.now();
    const data = await getAllFromDB('pokemonOwnership');
    const endGetOwnership = Date.now();
    console.log(`Retrieved ownership data from IndexedDB in ${(endGetOwnership - startGetOwnership)} ms`);

    // Convert array to object with instance_id as keys
    const ownershipData = {};
    data.forEach(item => {
        ownershipData[item.instance_id] = item;
    });

    // Get timestamp from localStorage
    const timestamp = parseInt(localStorage.getItem('ownershipTimestamp'), 10) || 0;

    return { data: ownershipData, timestamp };
}

export async function setOwnershipDataAsync(data) {
    // First, clear the 'pokemonOwnership' store
    const startClearStore = Date.now();
    await clearStore('pokemonOwnership');
    const endClearStore = Date.now();
    console.log(`Cleared 'pokemonOwnership' store in ${(endClearStore - startClearStore)} ms`);

    // Then, write all ownershipData items into 'pokemonOwnership' store using a single transaction
    const startStoreOwnership = Date.now();
    const ownershipData = data.data;
    const itemsArray = Object.keys(ownershipData).map(instance_id => {
        return { ...ownershipData[instance_id], instance_id };
    });
    await putBulkIntoDB('pokemonOwnership', itemsArray);
    const endStoreOwnership = Date.now();
    console.log(`Stored ownership data into IndexedDB in ${(endStoreOwnership - startStoreOwnership)} ms`);

    // Update timestamp in localStorage
    localStorage.setItem('ownershipTimestamp', data.timestamp.toString());
}

export async function initializeOrUpdateOwnershipDataAsync(keys, variants) {
    try {
        let { data: storedData } = await getOwnershipDataAsync();
        console.log("Parsed ownershipData:", storedData);

        let shouldUpdateStorage = false;
        let updates = {};

        // Convert the stored keys into a set of prefixes by isolating the UUID part if present
        const existingKeys = new Set(Object.keys(storedData).map(key => {
            const keyParts = key.split('_');
            const possibleUUID = keyParts[keyParts.length - 1];
            if (validateUUID(possibleUUID)) {
                keyParts.pop();
            }
            return keyParts.join('_');
        }));

        const startOwnershipUpdate = Date.now();
        variants.forEach((variant, index) => {
            const key = keys[index];
            if (!existingKeys.has(key)) {
                const fullKey = `${key}_${generateUUID()}`;
                const instance_id = fullKey;
                storedData[instance_id] = createNewDataForVariant(variant);
                updates[instance_id] = storedData[instance_id];
                shouldUpdateStorage = true;
            }
        });
        const endOwnershipUpdate = Date.now();
        console.log(`Initialized or updated ownership data in ${(endOwnershipUpdate - startOwnershipUpdate)} ms`);

        if (shouldUpdateStorage) {
            console.log('Added new ownership data for keys:', updates);
            await setOwnershipDataAsync({ data: storedData, timestamp: Date.now() });
        } else {
            console.log('No ownership updates required.');
        }
        return storedData;
    } catch (error) {
        console.error('Error updating ownership data:', error);
        throw new Error('Failed to update ownership data');
    }
}