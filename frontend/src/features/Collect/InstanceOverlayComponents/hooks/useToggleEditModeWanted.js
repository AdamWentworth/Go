// useToggleEditModeWanted.js

import { updateNotWantedList } from '../utils/ReciprocalUpdate.js';

export const toggleEditMode = ({
    editMode,
    setEditMode,
    localNotTradeList,
    setLocalNotTradeList,
    pokemon,
    ownershipData,
    filteredOutPokemon,
    localTradeFilters,
    updateDetails,
}) => {
    // console.log('Toggle Edit Mode Triggered');
    // console.log('Edit Mode:', editMode);
    // console.log('Original not_trade_list:', pokemon.ownershipStatus.not_trade_list);
    // console.log('Local not_trade_list before update:', localNotTradeList);

    if (editMode) {
        const updatedNotTradeList = { ...localNotTradeList };
        filteredOutPokemon.forEach(key => {
            updatedNotTradeList[key] = true;
        });

        const removedKeys = Object.keys(pokemon.ownershipStatus.not_trade_list).filter(key => !updatedNotTradeList[key]);
        const addedKeys = Object.keys(updatedNotTradeList).filter(key => !pokemon.ownershipStatus.not_trade_list[key]);

        const updatesToApply = {};

        removedKeys.forEach(key => {
            const updatedNotWantedList = updateNotWantedList(
                ownershipData,
                pokemon.pokemonKey,
                key,
                false
            );

            if (updatedNotWantedList) {
                updatesToApply[key] = {
                    not_wanted_list: updatedNotWantedList,
                };
            }
        });

        addedKeys.forEach(key => {
            const updatedNotWantedList = updateNotWantedList(
                ownershipData,
                pokemon.pokemonKey,
                key,
                true
            );

            if (updatedNotWantedList) {
                updatesToApply[key] = {
                    not_wanted_list: updatedNotWantedList,
                };
            }
        });

        updatesToApply[pokemon.pokemonKey] = {
            not_trade_list: updatedNotTradeList,
            trade_filters: localTradeFilters,
        };

        updateDetails([...removedKeys, ...addedKeys, pokemon.pokemonKey], updatesToApply);
        setLocalNotTradeList(updatedNotTradeList);
    }

    console.log('Local not_trade_list after toggleEditMode:', localNotTradeList);
    setEditMode(!editMode);
    pokemon.ownershipStatus.not_trade_list = localNotTradeList;
};
