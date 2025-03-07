// useTradeFiltering.js

import { useState, useEffect } from 'react';
import filters from '../utils/tradeFilters';
import { EXCLUDE_IMAGES_trade, INCLUDE_IMAGES_trade, FILTER_NAMES_TRADE } from '../utils/constants';

const useTradeFiltering = (
    listsState, 
    selectedExcludeImages, 
    selectedIncludeOnlyImages, 
    localTradeFilters, 
    setLocalNotTradeList, 
    localNotTradeList, 
    editMode
) => {
    const [filteredTradeList, setfilteredTradeList] = useState(listsState.trade);
    const [filteredOutPokemon, setFilteredOutPokemon] = useState([]);
    const [updatedLocalTradeFilters, setUpdatedLocalTradeFilters] = useState({ ...localTradeFilters });

    useEffect(() => {

        let updatedList = { ...listsState.trade };
        const newlyFilteredOutPokemon = [];
        const reappearingPokemon = [];
        const appliedFilters = []; // Track the applied filters and their order

        const resetFilters = () => {
            Object.keys(updatedLocalTradeFilters).forEach(filterName => {
                updatedLocalTradeFilters[filterName] = false;
            });
        };

        resetFilters();

        // Apply exclude filters
        selectedExcludeImages.forEach((isSelected, index) => {
            const filterName = FILTER_NAMES_TRADE[index];
            if (isSelected && filters[filterName]) {
                appliedFilters.push(`Exclude: ${filterName}`);
                updatedList = filters[filterName](updatedList);
                updatedLocalTradeFilters[filterName] = true;
            } else {
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

        // Apply include-only filters (as a union) only to remaining Pokémon
        if (selectedIncludeOnlyImages.some(isSelected => isSelected)) {
            let unionIncludeList = {};
            selectedIncludeOnlyImages.forEach((isSelected, index) => {
                const filterIndex = EXCLUDE_IMAGES_trade.length + index;
                const filterName = FILTER_NAMES_TRADE[filterIndex];

                if (isSelected && filters[filterName]) {
                    appliedFilters.push(`Include: ${filterName}`);
                    const filteredByThisInclude = filters[filterName](listsState.trade);
                    Object.keys(filteredByThisInclude).forEach(key => {
                        if (filteredByThisInclude[key] && updatedList[key]) {
                            unionIncludeList[key] = listsState.trade[key];
                        }
                    });
                    updatedLocalTradeFilters[filterName] = true;
                } else {
                    updatedLocalTradeFilters[filterName] = false;
                }
            });

            updatedList = unionIncludeList;
        }

        // Track Pokémon filtered out by include-only filters
        Object.keys(listsState.trade).forEach(key => {
            if (!updatedList[key] && !newlyFilteredOutPokemon.includes(key)) {
                newlyFilteredOutPokemon.push(key);
            }
        });
        

        // If in edit mode, include the filtered-out Pokémon in the final list (greyed out)
        if (!editMode) {
            newlyFilteredOutPokemon.forEach(key => {
                if (!localNotTradeList[key]) {
                    updatedList[key] = { ...listsState.trade[key], greyedOut: true };
                    setLocalNotTradeList(prev => ({ ...prev, [key]: true }));
                }
            });
        }

        setfilteredTradeList(updatedList);
        setFilteredOutPokemon(newlyFilteredOutPokemon);
        setUpdatedLocalTradeFilters({ ...updatedLocalTradeFilters });

        // Remove reappearing Pokémon from the not_trade_list
        if (reappearingPokemon.length > 0) {
            const updatedNotTradeList = { ...localNotTradeList };
            reappearingPokemon.forEach(key => {
                delete updatedNotTradeList[key];
            });
        }

    }, [selectedExcludeImages, selectedIncludeOnlyImages, listsState.trade, editMode]);

    return { filteredTradeList, filteredOutPokemon, updatedLocalTradeFilters };
};

export default useTradeFiltering;

