//pokemonOwnershipManager.js
import { v4 as uuidv4 } from 'uuid';
export const ownershipDataCacheKey = "pokemonOwnership";
const cacheStorageName = 'pokemonCache'; // Consistent cache name

export async function initializeOrUpdateOwnershipData(keys) {
    let ownershipData;
    let shouldUpdateStorage = false;
    const lastUpdateTimestamp = localStorage.getItem('lastUpdateTimestamp');

    if (lastUpdateTimestamp && Date.now() - parseInt(lastUpdateTimestamp) < 86400000) {
        console.log('Skipping update, data is fresh.');
        return; // Skip update if last update was less than 24 hours ago
    }

    // Load data from storage
    if ('caches' in window) {
        try {
            const cache = await caches.open(cacheStorageName);
            const cachedResponse = await cache.match(`/${ownershipDataCacheKey}`);
            if (cachedResponse) {
                ownershipData = await cachedResponse.json();
            }
        } catch (error) {
            console.error('Failed to load data from Cache Storage:', error);
        }
    }
    if (!ownershipData) {
        ownershipData = JSON.parse(localStorage.getItem(ownershipDataCacheKey)) || {};
    }

    let updates = {};
    keys.forEach(key => {
        // Check if any existing key starts with the provided key
        if (!Object.keys(ownershipData).some(existingKey => existingKey.startsWith(key))) {
            const fullKey = `${key}_${uuidv4()}`; // Append UUID to create a full key
            ownershipData[fullKey] = createNewDataForVariant(fullKey);
            updates[fullKey] = ownershipData[fullKey];
            shouldUpdateStorage = true;
        }
    });

    // Save updates if necessary
    if (shouldUpdateStorage) {
        console.log('Added new ownership data for keys:', updates);
        localStorage.setItem(ownershipDataCacheKey, JSON.stringify(ownershipData));
        localStorage.setItem('lastUpdateTimestamp', Date.now().toString());
        console.log('Updated ownership data in localStorage.');

        if ('caches' in window) {
            const response = new Response(JSON.stringify(ownershipData), { headers: { 'Content-Type': 'application/json' } });
            await caches.open(cacheStorageName).then(cache => cache.put(`/${ownershipDataCacheKey}`, response));
            console.log('Data saved to Cache Storage successfully.');
        }
    } else {
        console.log('No updates required.');
    }
}

function createNewDataForVariant(variant) {
    // Logic to create new data based on the variant, possibly deconstructing parts of the variant object
    return {
        pokemon_id: variant.pokemon_id,
        cp: null,
        attack_iv: null,
        defense_iv: null,
        stamina_iv: null,
        shiny: variant.isShiny,
        costume_id: variant.costume_id,
        lucky: false,
        shadow: variant.isShadow,
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


export function updatePokemonOwnership(pokemonKey, newStatus, variants) {
    console.log(`Attempting to update/create ownership for ${pokemonKey} with status ${newStatus}`);
    const ownershipData = JSON.parse(localStorage.getItem(ownershipDataCacheKey)) || {};

    // Verify the full scope of variants being handled
    if (!Array.isArray(variants) || variants.length === 0) {
        console.error("Invalid or empty variants array provided", variants);
        return;
    }

    const variantData = variants.find(variant => pokemonKey === variant.pokemonKey);
    if (!variantData) {
        console.error("No variant data found for key:", pokemonKey);
        return;
    }
    console.log(`Using variant data for key ${pokemonKey}:`, variantData);

    // Updating or creating new ownership entries
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

    localStorage.setItem(ownershipDataCacheKey, JSON.stringify(ownershipData));
    console.log(`Updated ownership data for ${pokemonKey} with status ${newStatus}`);
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
