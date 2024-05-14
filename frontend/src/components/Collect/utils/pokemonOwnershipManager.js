//pokemonOwnershipManager.js

import { v4 as uuidv4 } from 'uuid';

export const ownershipDataCacheKey = "pokemonOwnership";
const cacheStorageName = 'pokemonCache'; // Consistent cache name

const getKeyParts = (key) => {
    const parts = {
        pokemonId: parseInt(key.split('-')[0]),
        costumeName: null,
        isShiny: key.includes("_shiny"),
        isDefault: key.includes("_default"),
        isShadow: key.includes("_shadow")
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


export async function initializeOrUpdateOwnershipData(keys, isNewData, Variants) {
    let ownershipData;
    let shouldUpdateStorage = false;
    
    // First try to load from Cache Storage
    if ('caches' in window) {
        try {
            const cache = await caches.open(cacheStorageName);
            const cachedResponse = await cache.match(`/${ownershipDataCacheKey}`);
            if (cachedResponse) {
                ownershipData = await cachedResponse.json();
                console.log('Loaded ownership data from Cache Storage.');
            }
        } catch (error) {
            console.error('Failed to load data from Cache Storage:', error);
        }
    }

    // Fallback to localStorage if Cache Storage is empty
    if (!ownershipData) {
        ownershipData = JSON.parse(localStorage.getItem(ownershipDataCacheKey)) || {};
        console.log('Loaded ownership data from localStorage.');
    }

    // Process each key
    for (const key of keys) {
        const { pokemonId, costumeName, isShiny, isDefault, isShadow } = getKeyParts(key);
        const variantsArray = Array.isArray(Variants) ? Variants : Variants.data;
        const pokemonVariant = variantsArray.find(variant => variant.pokemon_id === pokemonId);
        let costumeId = null;
        if (pokemonVariant && pokemonVariant.costumes) {
            const costume = pokemonVariant.costumes.find(costume => costume.name === costumeName);
            if (costume) {
                costumeId = costume.costume_id;
            }
        }

        const instanceId = uuidv4(); // Generate a unique instance ID
        const newData = {
            pokemon_id: pokemonId,
            cp: null,
            attack_iv: null,
            defense_iv: null,
            stamina_iv: null,
            shiny: isShiny,
            costume_id: costumeId,
            lucky: false,
            shadow: isShadow,
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

        // Only update or initialize if needed
        if (!ownershipData.hasOwnProperty(key)) {
            ownershipData[key] = { [instanceId]: newData };
            shouldUpdateStorage = true;
        } else if (isNewData) {
            ownershipData[key][instanceId] = newData;
            shouldUpdateStorage = true;
        }
    }

    // Perform storage updates only once after all keys are processed
    if (shouldUpdateStorage) {
        localStorage.setItem(ownershipDataCacheKey, JSON.stringify(ownershipData));
        console.log('Updated ownership data in localStorage.');

        if ('caches' in window) {
            try {
                const response = new Response(JSON.stringify(ownershipData), {
                    headers: { 'Content-Type': 'application/json' }
                });
                await caches.open(cacheStorageName).then(cache => cache.put(`/${ownershipDataCacheKey}`, response));
                console.log('Data saved to Cache Storage successfully.');
            } catch (error) {
                console.error('Failed to save data to Cache Storage:', error);
            }
        }
    }
}

export function getFilteredPokemonsByOwnership(pokemons, filter) {
    const ownershipData = JSON.parse(localStorage.getItem(ownershipDataCacheKey)) || {};

    let filterKey = filter.toLowerCase();
    if (filterKey === "trade") filterKey = "for_trade";  // Adjust the key for the filter name discrepancy

    if (!filter || !["unowned", "owned", "for_trade", "wanted"].includes(filterKey)) {
        return pokemons; // Return all pokemons if no filter is applied or if the filter is invalid
    }

    // Filter and return pokemons based on the ownership data
    return pokemons.map(pokemon => {
        const instances = ownershipData[pokemon.pokemonKey];
        if (!instances) {
            return null; // If no instances exist, exclude this pokemon
        }

        // Filter instances that match the condition
        const matchingInstances = Object.values(instances).filter(instance => instance[`is_${filterKey}`]);
        if (matchingInstances.length > 0) {
            return { ...pokemon, instances: matchingInstances }; // Attach only matching instances
        }

        return null;
    }).filter(pokemon => pokemon !== null); // Remove any null entries
}

export function updatePokemonOwnership(pokemonKey, newStatus) {
    const ownershipData = JSON.parse(localStorage.getItem(ownershipDataCacheKey)) || {};
    const instances = ownershipData[pokemonKey];

    if (instances) {
        Object.values(instances).forEach(instance => {
            // Reset all ownership related flags
            instance.is_unowned = false;
            instance.is_owned = false;
            instance.is_for_trade = false;
            instance.is_wanted = false;

            // Update the specific flag based on the new status
            switch (newStatus) {
                case 'Owned':
                    instance.is_owned = true;
                    break;
                case 'Unowned':
                    instance.is_unowned = true;
                    break;
                case 'Trade':
                    instance.is_for_trade = true;
                    break;
                case 'Wanted':
                    instance.is_wanted = true;
                    break;
            }
        });

        localStorage.setItem(ownershipDataCacheKey, JSON.stringify(ownershipData));
        console.log(`Updated ownership of ${pokemonKey} to ${newStatus}`);

        // Asynchronously update the cache storage
        updateCacheStorage(ownershipData);
    }
}

async function updateCacheStorage(data) {
    if ('caches' in window) {
        try {
            const cache = await caches.open(cacheStorageName);
            const response = new Response(JSON.stringify(data), {
                headers: { 'Content-Type': 'application/json' }
            });
            await cache.put(`/${ownershipDataCacheKey}`, response);
            console.log('Ownership data updated in Cache Storage successfully.');
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

export const moveHighlightedToFilter = (highlightedCards, setHighlightedCards, loadOwnershipData, setOwnershipFilter, filter) => {
    highlightedCards.forEach(pokemonKey => {
        updatePokemonOwnership(pokemonKey, filter);
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
