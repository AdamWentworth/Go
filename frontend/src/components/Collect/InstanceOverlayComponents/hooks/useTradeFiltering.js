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
        let includeFilteredList = {};
        const newlyFilteredOutPokemon = [];
        const updatedNotTradeList = { ...localNotTradeList };

        // Initialize all filters to false
        const resetFilters = () => {
            Object.keys(updatedLocalTradeFilters).forEach(filterName => {
                updatedLocalTradeFilters[filterName] = false;
            });
        };

        resetFilters();

        // Apply include-only filters (with an OR logic)
        if (selectedIncludeOnlyImages.some(isSelected => isSelected)) {
            Object.keys(listsState.trade).forEach(key => {
                selectedIncludeOnlyImages.forEach((isSelected, index) => {
                    const filterName = FILTER_NAMES[index];
                    if (isSelected && typeof filters[filterName] === 'function') {
                        if (filters[filterName]({ [key]: listsState.trade[key] })[key]) {
                            includeFilteredList[key] = listsState.trade[key];
                            updatedLocalTradeFilters[filterName] = true;
                        }
                    }
                });
            });
        } else {
            includeFilteredList = { ...listsState.trade };
        }

        let excludeFilteredList = { ...includeFilteredList };

        // Apply exclude filters
        selectedExcludeImages.forEach((isSelected, index) => {
            const filterName = FILTER_NAMES[INCLUDE_IMAGES_trade.length + index];
            if (isSelected && typeof filters[filterName] === 'function') {
                excludeFilteredList = filters[filterName](excludeFilteredList, false); // Ensure correct function call
                updatedLocalTradeFilters[filterName] = true;
            } else {
                // Ensure filter is marked as false when deselected
                updatedLocalTradeFilters[filterName] = false;
            }
        });

        // Track Pokémon filtered out by include-only and exclude filters and add them to not_trade_list
        Object.keys(listsState.trade).forEach(key => {
            if (!excludeFilteredList[key]) {
                newlyFilteredOutPokemon.push(key);
                updatedNotTradeList[key] = true;  // Add filtered out Pokémon to not_trade_list
            }
        });

        // If in edit mode, include the filtered-out Pokémon in the final list (greyed out)
        if (editMode) {
            newlyFilteredOutPokemon.forEach(key => {
                excludeFilteredList[key] = { ...listsState.trade[key], greyedOut: true };
            });
        }

        setFilteredTradeList(excludeFilteredList);
        setFilteredOutPokemon(newlyFilteredOutPokemon);
        setUpdatedLocalTradeFilters({ ...updatedLocalTradeFilters });
        setLocalNotTradeList(updatedNotTradeList);  // Update not_trade_list with all filtered out Pokémon

    }, [selectedExcludeImages, selectedIncludeOnlyImages, listsState.trade, editMode]);

    return { filteredTradeList, filteredOutPokemon, updatedLocalTradeFilters };
};

export default useTradeFiltering;