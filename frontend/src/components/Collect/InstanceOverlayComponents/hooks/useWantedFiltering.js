// useWantedFiltering.js

import { useState, useEffect } from 'react';
import filters from '../utils/filters';
import { EXCLUDE_IMAGES, INCLUDE_ONLY_IMAGES, FILTER_NAMES } from '../utils/constants';

const useWantedFiltering = (listsState, selectedExcludeImages, selectedIncludeOnlyImages, localWantedFilters, setLocalNotWantedList, localNotWantedList) => {
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
                Object.keys(listsState.wanted).forEach(key => {
                    if (!filters[filterName](updatedList)[key] && updatedList[key]) {
                        reappearingPokemon.push(key);
                    }
                });
                delete updatedLocalWantedFilters[filterName];
            }
        });

        Object.keys(listsState.wanted).forEach(key => {
            if (!updatedList[key]) {
                newlyFilteredOutPokemon.push(key);
            }
        });

        // Apply include-only filters
        if (selectedIncludeOnlyImages.some(isSelected => isSelected)) {
            let includeOnlyResults = {};
            selectedIncludeOnlyImages.forEach((isSelected, index) => {
                if (isSelected) {
                    const filterIndex = EXCLUDE_IMAGES.length + index;
                    const filterName = FILTER_NAMES[filterIndex];
                    const filtered = filters[filterName](listsState.wanted);
                    Object.keys(filtered).forEach(key => {
                        if (filtered[key]) {
                            includeOnlyResults[key] = filtered[key];
                        }
                    });
                    updatedLocalWantedFilters[filterName] = true;
                } else {
                    delete updatedLocalWantedFilters[FILTER_NAMES[EXCLUDE_IMAGES.length + index]];
                }
            });

            updatedList = includeOnlyResults;
        }

        Object.keys(listsState.wanted).forEach(key => {
            if (!updatedList[key] && !newlyFilteredOutPokemon.includes(key)) {
                newlyFilteredOutPokemon.push(key);
            }
        });

        setFilteredWantedList(updatedList);
        setFilteredOutPokemon(newlyFilteredOutPokemon);
        setUpdatedLocalWantedFilters({ ...updatedLocalWantedFilters });

        if (reappearingPokemon.length > 0) {
            const updatedNotWantedList = { ...localNotWantedList };
            reappearingPokemon.forEach(key => {
                delete updatedNotWantedList[key];
            });
        }        

    }, [selectedExcludeImages, selectedIncludeOnlyImages, listsState.wanted]);

    return { filteredWantedList, filteredOutPokemon, updatedLocalWantedFilters };
};

export default useWantedFiltering;
