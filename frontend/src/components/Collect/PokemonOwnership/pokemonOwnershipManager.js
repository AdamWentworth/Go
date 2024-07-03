//pokemonOwnershipManager.js
import { getKeyParts } from '../utils/PokemonIDUtils';
const ownershipDataCacheKey = "pokemonOwnership";

export function createNewDataForVariant(variant) {

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
        pref_lucky: false,
        registered: false,
        favorite: false,
        location_card: null,
        location_caught: null,
        friendship_level: null,
        date_caught: null,
        date_added: new Date().toISOString(),
        last_update: Date.now(),
        is_unowned: true,
        is_owned: false,
        is_for_trade: false,
        is_wanted: false,
        not_trade_list: {},
        not_wanted_list: {}
    };
}

export const loadOwnershipData = (setOwnershipData) => {
    const storedData = JSON.parse(localStorage.getItem(ownershipDataCacheKey));
    setOwnershipData(storedData.data); // Pass only the data part to the state
    console.log("Ownership data loaded:", storedData.data);
};

export const updateOwnershipFilter = (setOwnershipFilter, filterType) => {
    setOwnershipFilter(prev => prev === filterType ? "" : filterType);
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

// Function to update individual details of a Pokemon instance
export function updatePokemonDetails(pokemonKey, details, ownershipData) {
    if (ownershipData && ownershipData[pokemonKey]) {
        // Apply the new details to the specific entry
        ownershipData[pokemonKey] = {...ownershipData[pokemonKey], ...details};
        console.log(`Details updated for ${pokemonKey}:`, ownershipData[pokemonKey]);
    } else {
        console.error("No data found for the specified key:", pokemonKey);
    }
}

