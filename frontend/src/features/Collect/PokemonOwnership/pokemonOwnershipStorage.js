// pokemonStorageManager.js

import { getAllFromDB, putIntoDB, clearStore, getMetadata, updateMetadata } from '../../../services/indexedDBConfig';
import { generateUUID, validateUUID } from '../../../utils/PokemonIDUtils';
import { createNewDataForVariant } from './pokemonOwnershipManager';

export async function getOwnershipDataAsync() {
    // Get all ownership data from IndexedDB
    const data = await getAllFromDB('pokemonOwnership');
    // Convert array to object with instance_id as keys
    const ownershipData = {};
    data.forEach(item => {
        ownershipData[item.instance_id] = item;
    });

    // Get timestamp from metadata
    const metadata = await getMetadata('ownershipTimestamp');
    const timestamp = metadata ? metadata.timestamp : 0;

    return { data: ownershipData, timestamp };
}

export async function setOwnershipDataAsync(data) {
    // First, clear the 'pokemonOwnership' store
    await clearStore('pokemonOwnership');

    // Then, write each ownershipData item into 'pokemonOwnership' store
    const ownershipData = data.data;
    for (const instance_id in ownershipData) {
        const item = { ...ownershipData[instance_id], instance_id };
        await putIntoDB('pokemonOwnership', item);
    }

    // Update timestamp in metadata
    await updateMetadata('ownershipTimestamp', data.timestamp);
}

export async function initializeOrUpdateOwnershipDataAsync(keys, variants) {
    try {
        let { data: storedData, timestamp } = await getOwnershipDataAsync();
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
