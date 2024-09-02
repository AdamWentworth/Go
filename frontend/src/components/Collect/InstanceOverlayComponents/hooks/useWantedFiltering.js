// hooks/useWantedFiltering.js

import { useState, useEffect } from 'react';
import filters from '../utils/wantedFilters';
import { EXCLUDE_IMAGES_wanted, INCLUDE_IMAGES_wanted, FILTER_NAMES } from '../utils/constants';

const useWantedFiltering = (listsState, selectedExcludeImages, selectedIncludeOnlyImages, localWantedFilters, setLocalNotWantedList, localNotWantedList, editMode) => {
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
                updatedLocalWantedFilters[filterName] = false;
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
            const filterIndex = EXCLUDE_IMAGES_wanted.length + index;
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
                updatedLocalWantedFilters[filterName] = false;
            }
        });

        // Track Pokémon filtered out by include-only filters
        Object.keys(listsState.wanted).forEach(key => {
            if (!updatedList[key] && !newlyFilteredOutPokemon.includes(key)) {
                newlyFilteredOutPokemon.push(key);
            }
        });

        // If in edit mode, include the filtered-out Pokémon in the final list (greyed out)
        if (editMode) {
            newlyFilteredOutPokemon.forEach(key => {
                if (!localNotWantedList[key]) {
                    updatedList[key] = { ...listsState.wanted[key], greyedOut: true };
                    setLocalNotWantedList(prev => ({ ...prev, [key]: true }));
                }
            });
        }

        setFilteredWantedList(updatedList);
        setFilteredOutPokemon(newlyFilteredOutPokemon);
        setUpdatedLocalWantedFilters({ ...updatedLocalWantedFilters });

        // Remove reappearing Pokémon from the not_wanted_list
        if (reappearingPokemon.length > 0) {
            const updatedNotWantedList = { ...localNotWantedList };
            reappearingPokemon.forEach(key => {
                delete updatedNotWantedList[key];
            });
            // setLocalNotWantedList(updatedNotWantedList); // Un-comment if you want to reflect these changes immediately
        }

    }, [selectedExcludeImages, selectedIncludeOnlyImages, listsState.wanted, editMode]);

    return { filteredWantedList, filteredOutPokemon, updatedLocalWantedFilters };
};

export default useWantedFiltering;