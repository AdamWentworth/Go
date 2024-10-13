// useToggleEditModeTrade.js

import { useState } from 'react';
import { updateNotTradeList } from '../utils/ReciprocalUpdate.js';
import { updateDisplayedList } from '../utils/listUtils.js';

const useToggleEditModeTrade = (
    pokemon,
    ownershipData,
    isMirror,
    mirrorKey,
    setMirrorKey,
    setIsMirror,
    lists,
    listsState,
    setListsState,
    localNotWantedList,
    setLocalNotWantedList,
    localWantedFilters,
    updateDetails,
    filteredOutPokemon
) => {
    const [editMode, setEditMode] = useState(false);

    const toggleEditMode = () => {
        // console.log('Toggle Edit Mode Triggered');
        // console.log('Edit Mode:', editMode);
        // console.log('Original not_wanted_list:', pokemon.ownershipStatus.not_wanted_list);
        // console.log('Local not_wanted_list before update:', localNotWantedList);

        if (editMode) {
            const updatedNotWantedList = { ...localNotWantedList };
            filteredOutPokemon.forEach(key => {
                updatedNotWantedList[key] = true;
            });

            const removedKeys = Object.keys(pokemon.ownershipStatus.not_wanted_list).filter(key => !updatedNotWantedList[key]);
            const addedKeys = Object.keys(updatedNotWantedList).filter(key => !pokemon.ownershipStatus.not_wanted_list[key]);

            const updatesToApply = {};

            removedKeys.forEach(key => {
                const updatedNotTradeList = updateNotTradeList(
                    ownershipData,
                    pokemon.pokemonKey,
                    key,
                    false,
                    isMirror
                );

                if (updatedNotTradeList) {
                    updatesToApply[key] = {
                        not_trade_list: updatedNotTradeList,
                    };
                }
            });

            addedKeys.forEach(key => {
                const updatedNotTradeList = updateNotTradeList(
                    ownershipData,
                    pokemon.pokemonKey,
                    key,
                    true,
                    isMirror
                );

                if (updatedNotTradeList) {
                    updatesToApply[key] = {
                        not_trade_list: updatedNotTradeList,
                    };
                }
            });

            updatesToApply[pokemon.pokemonKey] = {
                not_wanted_list: updatedNotWantedList,
                wanted_filters: localWantedFilters,
                mirror: isMirror,
            };

            if (!isMirror && mirrorKey) {
                console.log('Handling Mirror Key Management');
                delete ownershipData[mirrorKey];
                delete lists.wanted[mirrorKey];
                updateDisplayedList(null, listsState, setListsState);
                setMirrorKey(null);
            }

            updateDetails([...removedKeys, ...addedKeys, pokemon.pokemonKey], updatesToApply);
            setLocalNotWantedList(updatedNotWantedList);
        } else {
            if (!isMirror && pokemon.ownershipStatus.mirror) {
                updateDetails(pokemon.pokemonKey, {
                    ...pokemon.ownershipStatus,
                    mirror: false,
                });
            }
        }

        console.log('Local not_wanted_list after toggleEditMode:', localNotWantedList);
        setEditMode(!editMode);

        pokemon.ownershipStatus.not_wanted_list = localNotWantedList;
    };

    return { editMode, toggleEditMode };
};

export default useToggleEditModeTrade;
