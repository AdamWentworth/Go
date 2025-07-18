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
        // console.log('--- toggleEditMode TRIGGERED ---');
        // console.log('Current editMode value:', editMode);
        // console.log('pokemonKey:', pokemon.pokemonKey);
        // console.log('instanceData.not_wanted_list BEFORE all changes:', pokemon.instanceData.not_wanted_list);
        // console.log('localNotWantedList BEFORE all changes:', localNotWantedList);    

        if (editMode) {
            const updatedNotWantedList = { ...localNotWantedList };

            // Make sure to log right here:
            // console.log('updatedNotWantedList AFTER copy from localNotWantedList:', updatedNotWantedList);

            filteredOutPokemon.forEach(key => {
                updatedNotWantedList[key] = true;
            });

            // console.log('updatedNotWantedList AFTER setting filteredOutPokemon to true:', updatedNotWantedList);
    

            const removedKeys = Object.keys(pokemon.instanceData.not_wanted_list).filter(
                key => !updatedNotWantedList[key]
              );
              const addedKeys = Object.keys(updatedNotWantedList).filter(
                key => !pokemon.instanceData.not_wanted_list[key]
              );
              
            //   console.log('removedKeys:', removedKeys);
            //   console.log('addedKeys:', addedKeys);              

            const updatesToApply = {};

            removedKeys.forEach(key => {
                // console.log(
                //   'Removing Key from notWantedList -> updateNotTradeList with false:',
                //   { key, pokemonKey: pokemon.pokemonKey }
                // );
                const updatedNotTradeList = updateNotTradeList(
                  ownershipData,
                  pokemon.pokemonKey,
                  key,
                  false,
                  isMirror
                );
                // console.log('updatedNotTradeList (REMOVAL) returned:', updatedNotTradeList);

                if (updatedNotTradeList) {
                    updatesToApply[key] = {
                        not_trade_list: updatedNotTradeList,
                    };
                }
            });

            addedKeys.forEach(key => {
                // console.log(
                //   'Adding Key to notWantedList -> updateNotTradeList with true:',
                //   { key, pokemonKey: pokemon.pokemonKey }
                // );
                const updatedNotTradeList = updateNotTradeList(
                  ownershipData,
                  pokemon.pokemonKey,
                  key,
                  true,
                  isMirror
                );
                // console.log('updatedNotTradeList (ADDITION) returned:', updatedNotTradeList);

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
                // console.log('Handling Mirror Key Management');
                delete ownershipData[mirrorKey];
                delete lists.wanted[mirrorKey];
                updateDisplayedList(null, listsState, setListsState);
                setMirrorKey(null);
            }

            // console.log('Final updatesToApply:', updatesToApply);

            updateDetails([...removedKeys, ...addedKeys, pokemon.pokemonKey], updatesToApply);
            // console.log('Called updateDetails with these keys:', [...removedKeys, ...addedKeys, pokemon.pokemonKey]);
            setLocalNotWantedList(updatedNotWantedList);
        } else {
            if (!isMirror && pokemon.instanceData.mirror) {
                updateDetails(pokemon.pokemonKey, {
                    ...pokemon.instanceData,
                    mirror: false,
                });
            }
        }

        // console.log('Local not_wanted_list after toggleEditMode:', localNotWantedList);
        setEditMode(!editMode);
        pokemon.instanceData.not_wanted_list = localNotWantedList;
        // console.log(
        //     'pokemon.instanceData.not_wanted_list AFTER assignment:',
        //     pokemon.instanceData.not_wanted_list
        //   );          
    };

    return { editMode, toggleEditMode };
};

export default useToggleEditModeTrade;