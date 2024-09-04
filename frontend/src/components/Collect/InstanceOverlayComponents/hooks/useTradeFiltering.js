// useTradeFiltering.js

import { useState, useEffect } from 'react';
import filters from '../utils/tradeFilters';
import { EXCLUDE_IMAGES_trade, INCLUDE_IMAGES_trade, FILTER_NAMES } from '../utils/constants';

const useTradeFiltering = (
    listsState,
    selectedExcludeImages,
    selectedIncludeOnlyImages,
    localTradeFilters,
    setLocalNotTradeList,
    localNotTradeList,
    editMode
) => {
    const [filteredTradeList, setFilteredTradeList] = useState(listsState.trade);
    const [filteredOutPokemon, setFilteredOutPokemon] = useState([]);
    const [updatedLocalTradeFilters, setUpdatedLocalTradeFilters] = useState({ ...localTradeFilters });

    useEffect(() => {
        let updatedList = { ...listsState.trade };
        const newlyFilteredOutPokemon = [];
        const reappearingPokemon = [];

        // Apply exclude filters
        selectedExcludeImages.forEach((isSelected, index) => {
            const filterName = FILTER_NAMES[index + INCLUDE_IMAGES_trade.length]; // Exclude filter names start after include filters
            if (isSelected && typeof filters[filterName] === 'function') {
                updatedList = filters[filterName](updatedList); // Apply exclude filter
                updatedLocalTradeFilters[filterName] = true;
            } else {
                // Re-evaluate visibility of Pokémon previously filtered by this filter
                Object.keys(listsState.trade).forEach(key => {
                    if (!filters[filterName](updatedList)[key] && updatedList[key]) {
                        reappearingPokemon.push(key);
                    }
                });
                updatedLocalTradeFilters[filterName] = false;
            }
        });

        // Track Pokémon filtered out by exclude filters
        Object.keys(listsState.trade).forEach(key => {
            if (!updatedList[key]) {
                newlyFilteredOutPokemon.push(key);
            }
        });

        // Apply include-only filters (as a union)
        if (selectedIncludeOnlyImages.some(isSelected => isSelected)) {
            let unionIncludeList = {};
            selectedIncludeOnlyImages.forEach((isSelected, index) => {
                const filterName = FILTER_NAMES[index];

                if (isSelected && typeof filters[filterName] === 'function') {
                    const filteredByThisInclude = filters[filterName](listsState.trade); // Filter only on the original trade list
                    Object.keys(filteredByThisInclude).forEach(key => {
                        // Add Pokémon to the union list if it passes any include filter and hasn't been excluded
                        if (filteredByThisInclude[key] && updatedList[key]) {
                            unionIncludeList[key] = listsState.trade[key];
                        }
                    });
                    updatedLocalTradeFilters[filterName] = true;
                } else {
                    updatedLocalTradeFilters[filterName] = false;
                }
            });

            // Use the union of all include-only filters but only for Pokémon not excluded
            updatedList = unionIncludeList;
        }

        // Track Pokémon filtered out by include-only filters
        Object.keys(listsState.trade).forEach(key => {
            if (!updatedList[key] && !newlyFilteredOutPokemon.includes(key)) {
                newlyFilteredOutPokemon.push(key);
            }
        });

        // If in edit mode, include the filtered-out Pokémon in the final list (greyed out)
        if (editMode) {
            newlyFilteredOutPokemon.forEach(key => {
                if (!localNotTradeList[key]) {
                    updatedList[key] = { ...listsState.trade[key], greyedOut: true };
                    setLocalNotTradeList(prev => ({ ...prev, [key]: true }));
                }
            });
        }

        setFilteredTradeList(updatedList);
        setFilteredOutPokemon(newlyFilteredOutPokemon);
        setUpdatedLocalTradeFilters({ ...updatedLocalTradeFilters });

        // Remove reappearing Pokémon from the not_trade_list
        if (reappearingPokemon.length > 0) {
            const updatedNotTradeList = { ...localNotTradeList };
            reappearingPokemon.forEach(key => {
                delete updatedNotTradeList[key];
            });
            setLocalNotTradeList(updatedNotTradeList);
        }

    }, [selectedExcludeImages, selectedIncludeOnlyImages, listsState.trade, editMode]);

    return { filteredTradeList, filteredOutPokemon, updatedLocalTradeFilters };
};

export default useTradeFiltering;