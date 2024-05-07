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
