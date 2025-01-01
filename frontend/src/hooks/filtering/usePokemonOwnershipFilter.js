import { validateUUID } from '../../utils/PokemonIDUtils';

export function getFilteredPokemonsByOwnership(variants, ownershipData, filter, lists) {

    // Adjust the filter if necessary to handle special cases
    let filterKey;

    switch (filter.toLowerCase()) {
        case 'trade':
            filterKey = 'trade';
            break;
        case 'wanted':
            filterKey = 'wanted';
            break;
        case 'owned':
            filterKey = 'owned';
            break;
        case 'unowned':
            filterKey = 'unowned';
            break;
        default:
            console.warn(`Unknown filter: ${filter}. Returning empty array.`);
            return []; // Return empty array if filter doesn't match any expected values
    }

    // Get the keys from the corresponding list based on the filter
    const filteredKeys = Object.keys(lists[filterKey] || {});

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

        // Find the corresponding variant using the baseKey
        const variant = variants.find(v => v.pokemonKey === baseKey);
        if (variant) {
            const returnObject = {
                ...variant,
                pokemonKey: key,  // Use the full key to maintain uniqueness
                ownershipStatus: ownershipData[key]  // Optional: include ownership data if needed
            };
            return returnObject;
        }
    }).filter(pokemon => pokemon !== undefined);  // Filter out any undefined results due to missing variants

    return filteredPokemons;
}
