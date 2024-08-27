// hooks/usePokemonFiltering.js

import { useState, useEffect } from 'react';
import filters from '../utils/filters';
import { EXCLUDE_IMAGES, INCLUDE_ONLY_IMAGES, FILTER_NAMES } from '../utils/constants';

const usePokemonFiltering = (listsState, selectedExcludeImages, selectedIncludeOnlyImages, localWantedFilters, setLocalNotWantedList, localNotWantedList) => {
    const [filteredWantedList, setFilteredWantedList] = useState(listsState.wanted);
    const [filteredOutPokemon, setFilteredOutPokemon] = useState([]);
    const [updatedLocalWantedFilters, setUpdatedLocalWantedFilters] = useState({ ...localWantedFilters });

    useEffect(() => {
        let updatedList = { ...listsState.wanted };
        const newlyFilteredOutPokemon = [];
        const reappearingPokemon = [];

        // Apply exclude filters
        selectedExcludeImages.forEach((isSelected, index) => {
            const filterName = FILTER_NAMES[index];
            if (isSelected && filters[filterName]) {
                updatedList = filters[filterName](updatedList);
                updatedLocalWantedFilters[filterName] = true;
            } else {
                // Re-evaluate visibility of Pokémon previously filtered by this filter
                Object.keys(listsState.wanted).forEach(key => {
                    if (!filters[filterName](updatedList)[key] && updatedList[key]) {
                        reappearingPokemon.push(key);
                    }
                });
                delete updatedLocalWantedFilters[filterName];
            }
        });

        // Track Pokémon filtered out by exclude filters
        Object.keys(listsState.wanted).forEach(key => {
            if (!updatedList[key]) {
                newlyFilteredOutPokemon.push(key);
            }
        });

        // Apply include-only filters
        selectedIncludeOnlyImages.forEach((isSelected, index) => {
            const filterIndex = EXCLUDE_IMAGES.length + index;
            const filterName = FILTER_NAMES[filterIndex];
            if (isSelected && filters[filterName]) {
                updatedList = filters[filterName](updatedList);
                updatedLocalWantedFilters[filterName] = true;
            } else {
                // Re-evaluate visibility of Pokémon previously filtered by this filter
                Object.keys(listsState.wanted).forEach(key => {
                    if (!filters[filterName](updatedList)[key] && updatedList[key]) {
                        reappearingPokemon.push(key);
                    }
                });
                delete updatedLocalWantedFilters[filterName];
            }
        });

        // Track Pokémon filtered out by include-only filters
        Object.keys(listsState.wanted).forEach(key => {
            if (!updatedList[key] && !newlyFilteredOutPokemon.includes(key)) {
                newlyFilteredOutPokemon.push(key);
            }
        });

        // Update the state with the final filtered list and the filtered-out Pokémon
        setFilteredWantedList(updatedList);
        setFilteredOutPokemon(newlyFilteredOutPokemon);
        setUpdatedLocalWantedFilters({ ...updatedLocalWantedFilters });

        // Update localNotWantedList to remove only reappearing Pokémon
        if (reappearingPokemon.length > 0) {
            const updatedNotWantedList = { ...localNotWantedList };
            reappearingPokemon.forEach(key => {
                delete updatedNotWantedList[key];
            });
            setLocalNotWantedList((prevList) => ({
                ...prevList, // Keep all existing not-wanted Pokémon
                ...updatedNotWantedList, // Remove only the reappearing Pokémon
            }));
        }     

    }, [selectedExcludeImages, selectedIncludeOnlyImages, listsState.wanted]);

    return { filteredWantedList, filteredOutPokemon, updatedLocalWantedFilters };
};

export default usePokemonFiltering;