//pokemonOwnershipManager.js

export const ownershipDataCacheKey = "pokemonOwnership";

export function initializeOrUpdateOwnershipData(key, isNewData) {
    let ownershipData = JSON.parse(localStorage.getItem(ownershipDataCacheKey)) || {};
    
    if (!ownershipData.hasOwnProperty(key)) {
        ownershipData[key] = {
            unowned: true,
            owned: false,
            trade: false,
            wanted: false
        };
        localStorage.setItem(ownershipDataCacheKey, JSON.stringify(ownershipData));
        if (isNewData) {
            console.log("New ownership entries created for freshly fetched data.");
        }
    } else if (typeof ownershipData[key] === 'string') {
        ownershipData[key] = {
            unowned: true,
            owned: false,
            trade: false,
            wanted: false
        };
        localStorage.setItem(ownershipDataCacheKey, JSON.stringify(ownershipData));
        console.log("Corrected improperly initialized entries.");
    }
}

export function getFilteredPokemonsByOwnership(pokemons, filter) {
    const ownershipData = JSON.parse(localStorage.getItem(ownershipDataCacheKey)) || {};
    if (filter === "" || !["unowned", "owned", "trade", "wanted"].includes(filter.toLowerCase())) {
        return pokemons; // return all if no filter or invalid filter
    }
    console.log(pokemons.filter(pokemon => ownershipData[pokemon.pokemonKey] && ownershipData[pokemon.pokemonKey][filter.toLowerCase()]))
    return pokemons.filter(pokemon => ownershipData[pokemon.pokemonKey] && ownershipData[pokemon.pokemonKey][filter.toLowerCase()]);
}

export function updatePokemonOwnership(pokemonId, newStatus) {
    let ownershipData = JSON.parse(localStorage.getItem('pokemonOwnership')) || {};
    if (!ownershipData[pokemonId]) {
        ownershipData[pokemonId] = { unowned: false, owned: false, trade: false, wanted: false };
    }

    // Reset all to false then set the new status to true
    Object.keys(ownershipData[pokemonId]).forEach(key => {
        ownershipData[pokemonId][key] = false;
    });
    ownershipData[pokemonId][newStatus.toLowerCase()] = true; // Ensure the key is always lowercase

    localStorage.setItem('pokemonOwnership', JSON.stringify(ownershipData));
    console.log(`Updated ${pokemonId} to ${newStatus}`);
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
    highlightedCards.forEach(pokemonId => {
        updatePokemonOwnership(pokemonId, filter);
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

  
