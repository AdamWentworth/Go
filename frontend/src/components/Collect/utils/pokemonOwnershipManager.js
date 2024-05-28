//pokemonOwnershipManager.js
import { v4 as uuidv4 } from 'uuid';
const cacheStorageName = 'pokemonCache'; // Consistent cache name
const ownershipDataCacheKey = "pokemonOwnership";

export function initializeOrUpdateOwnershipData(keys, variants) {
    const ownershipDataCacheKey = "ownershipData";
    let rawOwnershipData = localStorage.getItem(ownershipDataCacheKey);

    let ownershipData = rawOwnershipData ? JSON.parse(rawOwnershipData) : {};
    console.log("Parsed ownershipData:", ownershipData);  // Verify parsed data

    let shouldUpdateStorage = false;
    let updates = {};
    
    variants.forEach((variant, index) => {
        const key = keys[index]; // Ensure keys and variants are synchronized by index
        // Check if any existing key starts with the provided key
        if (!Object.keys(ownershipData).some(existingKey => existingKey.startsWith(key))) {
            const fullKey = `${key}_${uuidv4()}`; // Append UUID to create a full key
            ownershipData[fullKey] = createNewDataForVariant(variant); // Use variant here instead of fullKey
            updates[fullKey] = ownershipData[fullKey];
            shouldUpdateStorage = true;
        }
    });

    // Save updates if necessary
    if (shouldUpdateStorage) {
        console.log('Added new ownership data for keys:', updates);
        localStorage.setItem(ownershipDataCacheKey, JSON.stringify({ data: ownershipData, timestamp: Date.now() }));
    } else {
        console.log('No updates required.');
    }
    return ownershipData
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
        location_card: null,
        friendship_level: null,
        date_caught: null,
        date_added: new Date().toISOString(),
        is_unowned: true,
        is_owned: false,
        is_for_trade: false,
        is_wanted: false
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

    console.log(`Filtered keys matching filter '${filterKey}':`, filteredKeys);

    // Map the filtered keys to their corresponding variant data
    const filteredPokemons = filteredKeys.map(key => {
        const baseKey = key.split('_')[0];  // Extract the base key to find corresponding variant
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


export async function updatePokemonOwnership(pokemonKey, newStatus, variants, setOwnershipData) {
    const ownershipData = JSON.parse(localStorage.getItem(ownershipDataCacheKey)) || {};
    const variantData = variants.find(variant => variant.pokemonKey === pokemonKey);
    if (!variantData) {
        console.error("No variant data found for key:", pokemonKey);
        return;
    }

    let needNewInstance = true;
    Object.keys(ownershipData).forEach(key => {
        if (key.startsWith(pokemonKey) && ownershipData[key].is_unowned) {
            updateInstanceStatus(ownershipData[key], newStatus);
            needNewInstance = false;
        }
    });

    if (needNewInstance) {
        const newKey = `${pokemonKey}_${uuidv4()}`;
        ownershipData[newKey] = createNewDataForVariant(variantData);
        updateInstanceStatus(ownershipData[newKey], newStatus);
    }

    // Update local storage
    localStorage.setItem(ownershipDataCacheKey, JSON.stringify(ownershipData));
    
    // Update cache storage
    if ('caches' in window) {
        try {
            const cache = await caches.open(cacheStorageName);
            const response = new Response(JSON.stringify(ownershipData), {
                headers: { 'Content-Type': 'application/json' }
            });
            await cache.put(`/${ownershipDataCacheKey}`, response);
            console.log('Ownership data updated in Cache Storage successfully.');
        } catch (error) {
            console.error('Failed to update data in Cache Storage:', error);
        }
    }

    // Update context state
    setOwnershipData(ownershipData);
}

function updateInstanceStatus(instance, newStatus) {
    console.log(`Updating status for ${instance.pokemon_id}: Current status is ${JSON.stringify(instance)}`);
    instance.is_unowned = newStatus === 'Unowned';
    instance.is_owned = newStatus === 'Owned' || newStatus === 'Trade';
    instance.is_for_trade = newStatus === 'Trade';
    instance.is_wanted = newStatus === 'Wanted';

    // Consistency checks
    if (newStatus === 'Trade' && !instance.is_owned) {
        instance.is_owned = true; // Must own a Pokémon to trade it
    }

    console.log(`Updated status for ${instance.pokemon_id} to ${newStatus}`);
}

async function updateCacheStorage(data) {
    if ('caches' in window) {
        try {
            const cache = await caches.open(cacheStorageName);
            const response = new Response(JSON.stringify(data), {
                headers: { 'Content-Type': 'application/json' }
            });
            await cache.put(`/${ownershipDataCacheKey}`, response);
            // console.log('Ownership data updated in Cache Storage successfully.');
        } catch (error) {
            console.error('Failed to update data in Cache Storage:', error);
        }
    }
}

export const loadOwnershipData = (setOwnershipData) => {
    const data = JSON.parse(localStorage.getItem(ownershipDataCacheKey)) || {};
    setOwnershipData(data);
    console.log("Ownership data loaded:", data);
};

export const updateOwnershipFilter = (setOwnershipFilter, filterType) => {
    setOwnershipFilter(prev => prev === filterType ? "" : filterType);
};

export const moveHighlightedToFilter = (highlightedCards, setHighlightedCards, loadOwnershipData, setOwnershipFilter, filter, Variants) => {
    highlightedCards.forEach(pokemonKey => {
        updatePokemonOwnership(pokemonKey, filter, Variants);
    });
    setHighlightedCards(new Set());
    loadOwnershipData();
    setOwnershipFilter(filter); // Directly set to the new filter without resetting
    console.log("Filter moved and ownership data reloaded for filter:", filter);
};

export const confirmMoveToFilter = (moveHighlightedToFilter, filter) => {
    if (window.confirm(`Move selected Pokemon to ${filter}?`)) {
        moveHighlightedToFilter(filter);
    }
};
