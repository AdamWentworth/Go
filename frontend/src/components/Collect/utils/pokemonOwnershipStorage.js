// pokemonStorageManager.js
const cacheStorageName = 'pokemonCache'; // Consistent cache name
const ownershipDataCacheKey = "pokemonOwnership";

export async function getOwnershipDataAsync() {
    const cache = await caches.open(cacheStorageName);
    const response = await cache.match(ownershipDataCacheKey);
    return response ? await response.json() : {};
}

export function getOwnershipData() {
    const rawOwnershipData = localStorage.getItem(ownershipDataCacheKey);
    return rawOwnershipData ? JSON.parse(rawOwnershipData) : {};
}

export function setOwnershipData(data) {
    localStorage.setItem(ownershipDataCacheKey, JSON.stringify(data));
}

export async function setOwnershipDataAsync(data) {
    const cache = await caches.open(cacheStorageName);
    const response = new Response(new Blob([JSON.stringify(data)], {type: 'application/json'}));
    await cache.put(ownershipDataCacheKey, response);
}


export function initializeOrUpdateOwnershipData(keys, variants) {
    let storedData = getOwnershipData();

    console.log("Parsed ownershipData:", storedData);  // Verify parsed data

     // Safeguard to ensure top-level data and timestamp only
     if (storedData.data && storedData.timestamp) {
        storedData = storedData.data; // Unwrap if wrapped correctly
    }

    let shouldUpdateStorage = false;
    let updates = {};
    
    variants.forEach((variant, index) => {
        const key = keys[index]; // Ensure keys and variants are synchronized by index
        // Check if any existing key starts with the provided key
        if (!Object.keys(storedData).some(existingKey => existingKey.startsWith(key))) {
            const fullKey = `${key}_${generateUUID()}`; // Append UUID to create a full key
            storedData[fullKey] = createNewDataForVariant(variant); // Use variant here instead of fullKey
            updates[fullKey] = storedData[fullKey];
            shouldUpdateStorage = true;
        }
    });

    // Save updates if necessary
    if (shouldUpdateStorage) {
        console.log('Added new ownership data for keys:', updates);
        setOwnershipData({ data: storedData, timestamp: Date.now() });
    } else {
        console.log('No ownership updates required.');
    }
    return storedData
}

export async function initializeOrUpdateOwnershipDataAsync(keys, variants) {
    try {
        let storedData = await getOwnershipDataAsync();
        console.log("Parsed ownershipData:", storedData);  // Verify parsed data

        // Unwrap if wrapped correctly
        if (storedData.data && storedData.timestamp) {
            storedData = storedData.data;
        }

        let shouldUpdateStorage = false;
        let updates = {};

        // Convert the stored keys into a set of prefixes by isolating the UUID part if present
        const existingKeys = new Set(Object.keys(storedData).map(key => {
            const keyParts = key.split('_');
            const possibleUUID = keyParts[keyParts.length - 1];
            if (validateUUID(possibleUUID)) {
                // If the last part is a UUID, return the key without the UUID
                keyParts.pop();
            }
            return keyParts.join('_'); // Rejoin the remaining parts to form the base key
        }));

        variants.forEach((variant, index) => {
            const key = keys[index];
            // Check if the base part of any existing key matches the provided key
            if (!existingKeys.has(key)) {
                const fullKey = `${key}_${generateUUID()}`; // Append UUID to create a full key
                storedData[fullKey] = createNewDataForVariant(variant);
                updates[fullKey] = storedData[fullKey];
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
