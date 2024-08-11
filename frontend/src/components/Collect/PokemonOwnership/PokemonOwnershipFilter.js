import { validateUUID } from '../utils/PokemonIDUtils';

export function getFilteredPokemonsByOwnership(variants, ownershipData, filter, lists) {
    // Adjust the filter if necessary to handle special cases
    const adjustedFilter = filter === 'Trade' ? 'trade' : filter.toLowerCase();
    console.log(`Filtering for status: ${adjustedFilter}`);

    // Select the correct list based on the filter
    const selectedList = lists[adjustedFilter];
    if (!selectedList) {
        return [];
    }

    // Get all keys from the selected list
    const filteredKeys = Object.keys(selectedList);

    // Map the filtered keys to their corresponding variant data
    const filteredPokemons = filteredKeys.map(key => {
        // Dynamically determine the base key based on the presence of a UUID
        const keyParts = key.split('_');
        const possibleUUID = keyParts[keyParts.length - 1];
        const hasUUID = validateUUID(possibleUUID);
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
