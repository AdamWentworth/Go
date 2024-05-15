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


export async function initializeOrUpdateOwnershipData(keys, Variants) {
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
        if (!ownershipData[key]) {
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

            // Initialize data if completely new or key is missing
            ownershipData[key] = { [instanceId]: newData };
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

export function updatePokemonOwnership(pokemonKey, newStatus, isNewInstance = false, Variants) {
    console.log(`Updating ownership status for ${pokemonKey} to ${newStatus}, new instance flag is ${isNewInstance}`);

    const ownershipData = JSON.parse(localStorage.getItem(ownershipDataCacheKey)) || {};
    let instances = ownershipData[pokemonKey] || {};

    if (isNewInstance || shouldCreateNewInstance(instances, newStatus)) {
        const instanceId = uuidv4();
        instances[instanceId] = createNewInstanceData(pokemonKey, newStatus, Variants);
        console.log(`Created new instance ${instanceId} for key ${pokemonKey} with status ${newStatus}`);
    } else {
        Object.values(instances).forEach(instance => {
            updateInstanceStatus(instance, newStatus);
        });
        console.log(`Updated existing instances for key ${pokemonKey} to status ${newStatus}`);
    }

    ownershipData[pokemonKey] = instances;
    localStorage.setItem(ownershipDataCacheKey, JSON.stringify(ownershipData));
    updateCacheStorage(ownershipData);
}

function shouldCreateNewInstance(instances, newStatus) {
    console.log(`Checking if a new instance is needed for status ${newStatus}`);
    return Object.values(instances).some(instance =>
        instance.is_owned || instance.is_for_trade || instance.is_wanted
    );
}

function createNewInstanceData(pokemonKey, newStatus, Variants) {
    console.log(`Creating new instance data for key ${pokemonKey} with status ${newStatus}`);
    const { pokemonId, costumeName, isShiny, isDefault, isShadow } = getKeyParts(pokemonKey);

    const variantsArray = Array.isArray(Variants) ? Variants : Variants.data;
    const pokemonVariant = variantsArray.find(variant => variant.pokemon_id === pokemonId);
    let costumeId = null;
    if (pokemonVariant && pokemonVariant.costumes) {
        const costume = pokemonVariant.costumes.find(costume => costume.name === costumeName);
        if (costume) {
            costumeId = costume.costume_id;
        }
    }
    return {
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
        is_unowned: newStatus === 'Unowned',
        is_owned: newStatus === 'Owned',
        is_for_trade: newStatus === 'Trade',
        is_wanted: newStatus === 'Wanted'
    };
}

function updateInstanceStatus(instance, newStatus) {
    console.log(`Updating status for instance to ${newStatus}`);

    // Reset all flags to ensure only the correct status is set
    instance.is_unowned = false;
    instance.is_owned = false;
    instance.is_for_trade = false;
    instance.is_wanted = false;

    // Determine the correct property name based on the new status
    const statusKey = getStatusKey(newStatus);
    instance[statusKey] = true;

    // Ensure that if the new status is 'Trade', the 'Owned' status is also set
    if (newStatus.toLowerCase() === 'trade' && !instance.is_owned) {
        instance.is_owned = true;
        console.log(`Set is_owned to true for the instance as it is necessary to own pokemon for trade.`);
    }

    console.log(`Set ${statusKey} to true for the instance.`);
}

// Helper function to map the human-readable status to the correct object key
function getStatusKey(newStatus) {
    switch(newStatus.toLowerCase()) {
        case 'owned':
            return 'is_owned';
        case 'trade':
            return 'is_for_trade';
        case 'wanted':
            return 'is_wanted';
        case 'unowned':
            return 'is_unowned';
        default:
            console.error(`Unknown status: ${newStatus}`);
            return 'is_unowned'; // Default case to avoid undefined behavior
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
        updatePokemonOwnership(pokemonKey, filter, false, Variants);
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
