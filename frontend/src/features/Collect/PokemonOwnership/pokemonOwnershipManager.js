//pokemonOwnershipManager.js
import { getKeyParts } from '../../../utils/PokemonIDUtils';
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
        not_wanted_list: {},
        trade_filters: {},
        wanted_filters: {},
        gps: null
    };
}

export const loadOwnershipData = (setOwnershipData) => {
    const storedData = JSON.parse(localStorage.getItem(ownershipDataCacheKey));
    setOwnershipData(storedData.data); // Pass only the data part to the state
    console.log("Ownership data loaded:", storedData.data);
};