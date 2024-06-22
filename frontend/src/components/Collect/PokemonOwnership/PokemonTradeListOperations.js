// PokemonTradeListOperations.js

import { parsePokemonKey } from "../utils/PokemonIDUtils";

export const updatePokemonLists = (ownershipData, variants, callback) => {
    const lists = {
        unowned: {},
        owned: {},
        trade: {},
        wanted: {}
    };

    Object.entries(ownershipData).forEach(([key, value]) => {
        const { baseKey } = parsePokemonKey(key); // Extract the base key from the key
        const variantDetail = variants.find(variant => variant.pokemonKey === baseKey); // Find the corresponding variant

        // Prepare the object to be added to the list
        const listItem = {
            currentImage: variantDetail.currentImage
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

        // Prepare the object to be added to the list
        const listItem = {
            currentImage: variantDetail.currentImage
        };

        // Assigning the listItem under the corresponding pokemonKey in each list
        if (value.is_unowned) lists.unowned[key] = listItem;
        if (value.is_owned) lists.owned[key] = listItem;
        if (value.is_for_trade) lists.trade[key] = listItem;
        if (value.is_wanted) lists.wanted[key] = listItem;
    });

    return lists;
};
