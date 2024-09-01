import { useState, useEffect } from 'react';
import filters from '../utils/filters';
import { EXCLUDE_IMAGES, INCLUDE_ONLY_IMAGES, FILTER_NAMES } from '../utils/constants';

const useTradeFiltering = (listsState, selectedExcludeImages, selectedIncludeOnlyImages, localNotTradeFilters, setLocalNotTradeList, localNotTradeList) => {
    const [filteredTradeList, setFilteredTradeList] = useState(listsState.trade);
    const [filteredOutPokemon, setFilteredOutPokemon] = useState([]);
    const [updatedLocalNotTradeFilters, setUpdatedLocalNotTradeFilters] = useState({ ...localNotTradeFilters });

    useEffect(() => {
        let updatedList = { ...listsState.trade };
        const newlyFilteredOutPokemon = [];
        const reappearingPokemon = [];

        // Apply exclude filters
        selectedExcludeImages.forEach((isSelected, index) => {
            const filterName = FILTER_NAMES[EXCLUDE_IMAGES.length + index];
            if (isSelected && filters[filterName]) {
                updatedList = filters[filterName](updatedList, true); // Assuming similar filter logic for trades
                updatedLocalNotTradeFilters[filterName] = true;
            } else {
                Object.keys(listsState.trade).forEach(key => {
                    if (!filters[filterName](updatedList, true)[key] && updatedList[key]) {
                        reappearingPokemon.push(key);
                    }
                });
                delete updatedLocalNotTradeFilters[filterName];
            }
        });

        // Track Pokémon filtered out by exclude filters
        Object.keys(listsState.trade).forEach(key => {
            if (!updatedList[key]) {
                newlyFilteredOutPokemon.push(key);
            }
        });

        // Apply include-only filters
        selectedIncludeOnlyImages.forEach((isSelected, index) => {
            const filterName = FILTER_NAMES[index];
            if (isSelected && filters[filterName]) {
                updatedList = filters[filterName](updatedList, true);
                updatedLocalNotTradeFilters[filterName] = true;
            } else {
                Object.keys(listsState.trade).forEach(key => {
                    if (!filters[filterName](updatedList, true)[key] && updatedList[key]) {
                        reappearingPokemon.push(key);
                    }
                });
                delete updatedLocalNotTradeFilters[filterName];
            }
        });

        // Track Pokémon filtered out by include-only filters
        Object.keys(listsState.trade).forEach(key => {
            if (!updatedList[key] && !newlyFilteredOutPokemon.includes(key)) {
                newlyFilteredOutPokemon.push(key);
            }
        });

        // Update the state with the final filtered list and the filtered-out Pokémon
        setFilteredTradeList(updatedList);
        setFilteredOutPokemon(newlyFilteredOutPokemon);
        setUpdatedLocalNotTradeFilters({ ...updatedLocalNotTradeFilters });

        // Remove reappearing Pokémon from the not_trade_list
        if (reappearingPokemon.length > 0) {
            const updatedNotTradeList = { ...localNotTradeList };
            reappearingPokemon.forEach(key => {
                delete updatedNotTradeList[key];
            });
            setLocalNotTradeList(updatedNotTradeList);
        }

    }, [selectedExcludeImages, selectedIncludeOnlyImages, listsState.trade]);

    return { filteredTradeList, filteredOutPokemon, updatedLocalNotTradeFilters };
};

export default useTradeFiltering;
