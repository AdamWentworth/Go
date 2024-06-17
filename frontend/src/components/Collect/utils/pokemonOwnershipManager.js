//pokemonOwnershipManager.js
import { v4 as uuidv4, validate as uuidValidate } from 'uuid';
const cacheStorageName = 'pokemonCache'; // Consistent cache name
const ownershipDataCacheKey = "pokemonOwnership";

export function initializeOrUpdateOwnershipData(keys, variants) {
    let rawOwnershipData = localStorage.getItem(ownershipDataCacheKey);

    let storedData = rawOwnershipData ? JSON.parse(rawOwnershipData) : {};
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
            const fullKey = `${key}_${uuidv4()}`; // Append UUID to create a full key
            storedData[fullKey] = createNewDataForVariant(variant); // Use variant here instead of fullKey
            updates[fullKey] = storedData[fullKey];
            shouldUpdateStorage = true;
        }
    });

    // Save updates if necessary
    if (shouldUpdateStorage) {
        console.log('Added new ownership data for keys:', updates);
        localStorage.setItem(ownershipDataCacheKey, JSON.stringify({ data: storedData, timestamp: Date.now() }));
    } else {
        console.log('No ownership updates required.');
    }
    return storedData
}

export async function initializeOrUpdateOwnershipDataAsync(keys, variants) {
    try {
        // Open the cache
        const cache = await caches.open(cacheStorageName);
        
        // Retrieve the cached response
        const response = await cache.match(ownershipDataCacheKey);
        let storedData = response ? await response.json() : {};
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
            if (uuidValidate(possibleUUID)) {
                // If the last part is a UUID, return the key without the UUID
                keyParts.pop();
            }
            return keyParts.join('_'); // Rejoin the remaining parts to form the base key
        }));

        variants.forEach((variant, index) => {
            const key = keys[index];
            // Check if the base part of any existing key matches the provided key
            if (!existingKeys.has(key)) {
                const fullKey = `${key}_${uuidv4()}`; // Append UUID to create a full key
                storedData[fullKey] = createNewDataForVariant(variant);
                updates[fullKey] = storedData[fullKey];
                shouldUpdateStorage = true;
            }
        });

        if (shouldUpdateStorage) {
            console.log('Added new ownership data for keys:', updates);
        } else {
            console.log('No ownership updates required.');
        }

        return storedData;
    } catch (error) {
        console.error('Error updating ownership data:', error);
        throw new Error('Failed to update ownership data');
    }
}

const getKeyParts = (key) => {

    const parts = {
        pokemonId: parseInt(key.split('-')[0]),
        costumeName: null,
        isShiny: key.includes("_shiny") || key.includes("-shiny"),
        isDefault: key.includes("_default") || key.includes("-default"),
        isShadow: key.includes("_shadow") || key.includes("-shadow")
    };

    let costumeSplit = key.split('-')[1];
    if (costumeSplit) {

        // Check for the presence of known suffixes and adjust the split accordingly
        if (parts.isShiny) {
            costumeSplit = costumeSplit.split('_shiny')[0];
        } else if (parts.isDefault) {
            costumeSplit = costumeSplit.split('_default')[0];
        } else if (parts.isShadow) {
            costumeSplit = costumeSplit.split('_shadow')[0];
        }
        parts.costumeName = costumeSplit;

    }

    return parts;
};

function createNewDataForVariant(variant) {

    const keyParts = getKeyParts(variant.pokemonKey);
    const matchedCostume = variant.costumes.find(c => c.name === keyParts.costumeName);
    const costumeId = matchedCostume ? matchedCostume.costume_id : null;

    // Logic to create new data based on the variant, possibly deconstructing parts of the variant object
    return {
        pokemon_id: variant.pokemon_id,
        nickname: null,
        cp: null,
        attack_iv: null,
        defense_iv: null,
        stamina_iv: null,
        shiny: keyParts.isShiny,
        costume_id: costumeId,
        lucky: false,
        shadow: keyParts.isShadow,
        purified: false,
        fast_move_id: null,
        charged_move1_id: null,
        charged_move2_id: null,
        weight: null,
        height: null,
        gender: null,
        mirror: false,
        registered: false,
        favorite: false,
        location_card: null,
        location_caught: null,
        friendship_level: null,
        date_caught: null,
        date_added: new Date().toISOString(),
        is_unowned: true,
        is_owned: false,
        is_for_trade: false,
        is_wanted: false,
        trade_list: {}
    };
}

export function getFilteredPokemonsByOwnership(variants, ownershipData, filter) {
    // Adjust the filter if necessary to handle special cases
    const adjustedFilter = filter === 'Trade' ? 'for_trade' : filter;
    const filterKey = `is_${adjustedFilter.toLowerCase()}`;
    console.log(`Filtering for status: ${filterKey}`);

    // Get all keys that match the filter criteria, including their UUIDs
    const filteredKeys = Object.entries(ownershipData)
        .filter(([key, data]) => data[filterKey])
        .map(([key]) => key);  // Maintain the full key with UUID

    // Map the filtered keys to their corresponding variant data
    const filteredPokemons = filteredKeys.map(key => {
        // Dynamically determine the base key based on the presence of a UUID
        const keyParts = key.split('_');
        const possibleUUID = keyParts[keyParts.length - 1];
        const hasUUID = uuidValidate(possibleUUID);
        let baseKey;

        if (hasUUID) {
            keyParts.pop(); // Remove the UUID part for matching in variants
            baseKey = keyParts.join('_');
        } else {
            baseKey = key; // Use the full key if no UUID is present
        }
        const variant = variants.find(v => v.pokemonKey === baseKey);
        if (variant) {
            return {
                ...variant,
                pokemonKey: key,  // Use the full key to maintain uniqueness
                ownershipStatus: ownershipData[key]  // Optional: include ownership data if needed
            };
        }
    }).filter(pokemon => pokemon !== undefined);  // Filter out any undefined results due to missing variants

    console.log(`Pokémons after applying filter:`, filteredPokemons);
    return filteredPokemons;
}

export function updatePokemonOwnership(pokemonKey, newStatus, variants, ownershipData, setOwnershipData) {
    const keyParts = pokemonKey.split('_');
    const possibleUUID = keyParts[keyParts.length - 1];
    const hasUUID = uuidValidate(possibleUUID);
    let baseKey;

    if (hasUUID) {
        keyParts.pop(); // Remove the UUID part
        baseKey = keyParts.join('_');
    } else {
        baseKey = pokemonKey;
    }

    const variantData = variants.find(variant => variant.pokemonKey === baseKey);
    if (!variantData) {
        console.error("No variant data found for base key:", baseKey);
        return;
    }

    if (hasUUID) {
        handleSpecificInstanceWithUUID(pokemonKey, newStatus, ownershipData, variantData);
    } else {
        handleDefaultEntry(pokemonKey, newStatus, ownershipData, variantData);
    }

    setTimeout(() => {
        setOwnershipData(ownershipData);  // This should trigger a re-render
    }, 0);
}

function handleSpecificInstanceWithUUID(pokemonKey, newStatus, ownershipData, variantData) {
    const instance = ownershipData[pokemonKey];

    // If no variant data found, log and exit
    if (!variantData) {
        console.error("No variant data found for key:", pokemonKey);
        return;
    }
    
    switch (newStatus) {
        case 'Owned':
            instance.is_owned = true;
            instance.is_for_trade = false;  // Ensure it's not for trade when set to owned directly
            instance.is_unowned = false;
            instance.is_wanted = false;
            break;
        case 'Trade':
            instance.is_owned = true;  // Ensure that a tradeable instance is owned
            instance.is_for_trade = true;
            instance.is_unowned = false;
            instance.is_wanted = false;
            break;
        case 'Wanted':
            // Create a new instance if transitioning to wanted from owned
            if (instance.is_owned) {

                let keyParts = pokemonKey.split('_');
                keyParts.pop(); // Remove the UUID part
                let basePrefix = keyParts.join('_'); // Rejoin to form the actual prefix
                const newKey = `${basePrefix}_${uuidv4()}`;
                const newData = { 
                    ...instance,
                    is_wanted: true,
                    is_owned: false,  
                    is_for_trade: false,
                    is_unowned: false }  
                ownershipData[newKey] = newData;

            } else {
                instance.is_wanted = true;
                // Extract the prefix by joining all parts except the last segment which is presumed to be the UUID
                const keyParts = pokemonKey.split('_');
                keyParts.pop(); // Remove the last segment (UUID)
                const prefix = keyParts.join('_'); // Rejoin the rest as the prefix

                // Check if there are any other owned instances with the same prefix
                let anyOwned = Object.values(ownershipData).some(data =>
                    data.is_owned && data.pokemonKey.startsWith(prefix)
                );

                // Set is_unowned based on the existence of any owned instances
                instance.is_unowned = !anyOwned;
            }
            break;
        case 'Unowned':
            // Isolating the prefix by excluding the last UUID segment
            let keyParts = pokemonKey.split('_');
            keyParts.pop(); // Remove the UUID part
            let basePrefix = keyParts.join('_'); // Rejoin to form the actual prefix
        
            let relatedInstances = Object.keys(ownershipData).filter(key => key.startsWith(basePrefix) && key !== pokemonKey);
            let isOnlyInstance = relatedInstances.length === 0; // Check if there are no other related instances
        
            if (!isOnlyInstance) {
                // If there are other instances, confirm deletion
                delete ownershipData[pokemonKey]; // Delete the instance from ownership data
            }
            else {
                // If it's the only instance, just mark as unowned without deletion
                instance.is_unowned = true;
                instance.is_owned = false;
                instance.is_for_trade = false;
            }
            break;
    }
}

function handleDefaultEntry(pokemonKey, newStatus, ownershipData, variantData) {
    // console.log('Handling default entry:', pokemonKey);

    let needNewInstance = true;
    Object.keys(ownershipData).forEach(key => {
        // Check if the key starts with the pokemonKey and if the instance is unowned and not wanted
        if (key.startsWith(pokemonKey) && ownershipData[key].is_unowned && !ownershipData[key].is_wanted) {
            updateInstanceStatus(ownershipData[key], newStatus, ownershipData, pokemonKey);
            needNewInstance = false;
        }
    });

    // If no suitable instance is found, create a new one
    if (needNewInstance) {
        const newKey = `${pokemonKey}_${uuidv4()}`;
        ownershipData[newKey] = createNewDataForVariant(variantData);
        updateInstanceStatus(ownershipData[newKey], newStatus, ownershipData, pokemonKey);
    }
}

function updateInstanceStatus(instance, newStatus, ownershipData, baseKey) {
    // console.log(`Updating status for ${instance.pokemon_id}: Current status is ${JSON.stringify(instance)}`);

    // Initial setup for statuses based on the newStatus
    instance.is_unowned = newStatus === 'Unowned';
    instance.is_owned = newStatus === 'Owned' || newStatus === 'Trade';
    instance.is_for_trade = newStatus === 'Trade';
    instance.is_wanted = newStatus === 'Wanted';

    // Conditional application of status updates to other instances sharing the same prefix
    Object.keys(ownershipData).forEach(key => {
        if (key.startsWith(baseKey) && key !== instance.pokemon_id) {
            switch (newStatus) {
                case 'Unowned':
                    ownershipData[key].is_owned = false;
                    ownershipData[key].is_for_trade = false;
                    break;
                case 'Owned':
                case 'Trade':
                    ownershipData[key].is_unowned = false;
                    break;
                case 'Wanted':
                    // Special logic to ensure is_unowned is not incorrectly set to false
                    if (ownershipData[key].is_owned) {
                        instance.is_unowned = false;
                    }
                    break;
            }
        }
    });

    // Ensure that if the new status is 'Trade', the instance is marked as owned
    if (newStatus === 'Trade' && !instance.is_owned) {
        instance.is_owned = true;
    }

    // Additional handling to ensure the 'Wanted' status doesn't incorrectly set 'is_unowned' to false
    // when no other instances are owned
    if (newStatus === 'Wanted') {
        let anyOwned = Object.values(ownershipData).some(data => {
            // Log checking each entry for owned status and base key matching
            // console.log(`Checking ${data.pokemon_id}: is_owned=${data.is_owned}, startsWith=${String(data.pokemon_id).startsWith(baseKey)}`);
            return data.is_owned && String(data.pokemon_id).startsWith(baseKey); // Convert to string here
        });

        // Log the result of the anyOwned check
        // console.log(`Result of anyOwned check for baseKey '${baseKey}': ${anyOwned}`);

        if (!anyOwned) {
            instance.is_unowned = true; // Ensure is_unowned stays true if no other owned instances exist
            // Log setting is_unowned to true
            // console.log(`Setting is_unowned to true for ${instance.pokemon_id} as no owned instances exist with baseKey '${baseKey}'.`);
        }
    }

    // console.log(`Updated status for ${instance.pokemon_id} to ${newStatus}`);
}

export const loadOwnershipData = (setOwnershipData) => {
    const storedData = JSON.parse(localStorage.getItem(ownershipDataCacheKey));
    setOwnershipData(storedData.data); // Pass only the data part to the state
    console.log("Ownership data loaded:", storedData.data);
};


export const updateOwnershipFilter = (setOwnershipFilter, filterType) => {
    setOwnershipFilter(prev => prev === filterType ? "" : filterType);
};

export const moveHighlightedToFilter = async (highlightedCards, setHighlightedCards, loadOwnershipData, setOwnershipFilter, filter, Variants, updatePokemonOwnership) => {
    const batchUpdateSize = 5;  // Define batch size
    let processed = 0;

    // Function to process a single batch
    const processBatch = () => {
        const batch = Array.from(highlightedCards).slice(processed, processed + batchUpdateSize);
        batch.forEach(pokemonKey => {
            updatePokemonOwnership(pokemonKey, filter, Variants);
        });
        processed += batch.length;

        // Update UI after each batch
        loadOwnershipData();
        if (processed < highlightedCards.size) {
            setTimeout(processBatch, 0); // Schedule next batch
        } else {
            // Finalize
            setHighlightedCards(new Set());
            setOwnershipFilter(filter);
            console.log("Filter moved and ownership data reloaded for filter:", filter);
        }
    };

    processBatch();  // Start processing
};

export const confirmMoveToFilter = (moveHighlightedToFilter, filter, highlightedCards, Variants, ownershipData) => {
    let messageDetails = [];  // Details for dynamic confirmation message

    highlightedCards.forEach(pokemonKey => {
        const instance = ownershipData[pokemonKey];
        // First check if the instance exists in the ownership data
        if (instance) {
            let currentStatus = instance.is_unowned ? 'Unowned' :
                                (instance.is_owned ? 'Owned' :
                                (instance.is_for_trade ? 'For Trade' :
                                (instance.is_wanted ? 'Wanted' : 'Unknown')));

            // Handle nickname or find variant name
            let displayName = instance.nickname;  // First try to use the nickname
            if (!displayName) {
                // If no nickname, derive the name from the variants
                let keyParts = pokemonKey.split('_');
                keyParts.pop(); // Remove the UUID part
                let basePrefix = keyParts.join('_'); // Rejoin to form the actual prefix
                const variant = Variants.find(v => v.pokemonKey === basePrefix);
                displayName = variant ? variant.name : "Unknown Pokémon";  // Use variant name if available
            }

            let actionDetail = `Move ${displayName} from ${currentStatus} to ${filter}`;
            if (!messageDetails.includes(actionDetail)) {
                messageDetails.push(actionDetail);
            }
        } else {
            // Handle the case where the pokemonKey does not have corresponding ownership data
            let actionDetail = `Move unknown Pokémon from Unknown to ${filter}`;
            messageDetails.push(actionDetail);
        }
    });

    let detailedMessage = `Are you sure you want to make the following changes?\n\n${messageDetails.join('\n')}`;
    if (window.confirm(detailedMessage)) {
        moveHighlightedToFilter(filter);
    }
};