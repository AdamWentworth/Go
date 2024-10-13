// PokemonTradeListOperations.js

import { parsePokemonKey } from "../../../utils/PokemonIDUtils";
import { determineImageUrl } from "../../../utils/imageHelpers"; 

export const updatePokemonLists = (ownershipData, variants, callback) => {
    const lists = {
        unowned: {},
        owned: {},
        trade: {},
        wanted: {}
    };
    // console.log(ownershipData)
    Object.entries(ownershipData).forEach(([key, value]) => {
        const { baseKey } = parsePokemonKey(key); // Extract the base key from the key
        const variantDetail = variants.find(variant => variant.pokemonKey === baseKey); // Find the corresponding variant

        if (!variantDetail) {
            console.error(`Variant not found for baseKey: ${baseKey}`);
            console.error(`Key: ${key}, Value:`, value);
        }

        // Check if the Pokémon is female and has female data, and update the image accordingly
        const isFemale = value.gender === 'Female';
        let currentImage = variantDetail?.currentImage;  // Default image

        if (isFemale && variantDetail?.female_data) {
            currentImage = determineImageUrl(isFemale, variantDetail);  // Update the image for female Pokémon
        }

        // Prepare the object to be added to the list
        const listItem = {
            currentImage: currentImage, // Safe navigation to avoid error if variantDetail is undefined
            friendship_level: value.friendship_level,
            mirror: value.mirror,
            pref_lucky: value.pref_lucky,
            pokemon_id: value.pokemon_id,
            cp: value.cp,
            hp: value.hp,
            favorite: value.favorite,
            name: variantDetail?.name,
            pokedex_number: variantDetail?.pokedex_number,
            date_available: variantDetail?.date_available,
            date_shiny_available: variantDetail?.date_shiny_available,
            date_shadow_available: variantDetail?.date_shadow_available,
            date_shiny_shadow_available: variantDetail?.date_shiny_shadow_available,
            costumes: variantDetail?.costumes,
            variantType: variantDetail?.variantType,
            shiny_rarity: variantDetail?.shiny_rarity,
            rarity: variantDetail?.rarity,
            location_card: value.location_card,
            key: key,
            gender: value.gender
        };

        // Assigning the listItem under the corresponding pokemonKey in each list
        if (value.is_unowned) lists.unowned[key] = listItem;
        if (value.is_owned) lists.owned[key] = listItem;
        if (value.is_for_trade) lists.trade[key] = listItem;
        if (value.is_wanted) lists.wanted[key] = listItem;
    });

    // Callback to use in context for updating via worker or setting state
    callback(lists);
};

export const initializePokemonLists = (ownershipData, variants) => {
    const lists = {
        unowned: {},
        owned: {},
        trade: {},
        wanted: {}
    };

    Object.entries(ownershipData).forEach(([key, value]) => {
        const { baseKey } = parsePokemonKey(key); // Extract the base key from the key
        const variantDetail = variants.find(variant => variant.pokemonKey === baseKey); // Find the corresponding variant

        // Check if the Pokémon is female and has female data, and update the image accordingly
        const isFemale = value.gender === 'Female';
        let currentImage = variantDetail?.currentImage;  // Default image

        if (isFemale && variantDetail?.female_data) {
            currentImage = determineImageUrl(isFemale, variantDetail);  // Update the image for female Pokémon
        }

        // Prepare the object to be added to the list
        const listItem = {
            currentImage: currentImage, // Safe navigation to avoid error if variantDetail is undefined
            friendship_level: value.friendship_level,
            mirror: value.mirror,
            pref_lucky: value.pref_lucky,
            pokemon_id: value.pokemon_id,
            cp: value.cp,
            hp: value.hp,
            favorite: value.favorite,
            name: variantDetail?.name,
            pokedex_number: variantDetail?.pokedex_number,
            date_available: variantDetail?.date_available,
            date_shiny_available: variantDetail?.date_shiny_available,
            date_shadow_available: variantDetail?.date_shadow_available,
            date_shiny_shadow_available: variantDetail?.date_shiny_shadow_available,
            costumes: variantDetail?.costumes,
            variantType: variantDetail?.variantType,
            shiny_rarity: variantDetail?.shiny_rarity,
            rarity: variantDetail?.rarity,
            location_card: value.location_card,
            key: key,
            gender: value.gender
        };

        // Assigning the listItem under the corresponding pokemonKey in each list
        if (value.is_unowned) lists.unowned[key] = listItem;
        if (value.is_owned) lists.owned[key] = listItem;
        if (value.is_for_trade) lists.trade[key] = listItem;
        if (value.is_wanted) lists.wanted[key] = listItem;
    });

    return lists;
};