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
              // Remove from notTradeList if included
              delete updatedNotTradeList[key];
            }
          }
        });
      });
    } else {
      includeFilteredList = { ...listsState.trade };
    }

    // Start by copying over everything from the includeFilteredList
    let excludeFilteredList = { ...includeFilteredList };

    // Apply exclude filters
    selectedExcludeImages.forEach((isSelected, index) => {
      const filterName = FILTER_NAMES[INCLUDE_IMAGES_trade.length + index];
      if (isSelected && typeof filters[filterName] === 'function') {
        // Important: ensure your filters actually remove the excluded Pokémon
        excludeFilteredList = filters[filterName](excludeFilteredList, false);
        updatedLocalTradeFilters[filterName] = true;
      } else {
        updatedLocalTradeFilters[filterName] = false;
      }
    });

    // Track Pokémon filtered out by exclude filters and add them to not_trade_list
    Object.keys(listsState.trade).forEach(key => {
      // If a Pokémon is missing from the final excludeFilteredList, it has been filtered out
      if (!excludeFilteredList[key]) {
        newlyFilteredOutPokemon.push(key);
        updatedNotTradeList[key] = true;
      }
    });

    // If in edit mode, grey out the filtered-out Pokémon (unless it’s been explicitly included)
    if (editMode) {
      newlyFilteredOutPokemon.forEach(key => {
        if (!includeFilteredList[key]) {
          excludeFilteredList[key] = { ...listsState.trade[key], greyedOut: true };
          setLocalNotTradeList(prev => ({ ...prev, [key]: true }));
        }
      });
    }

    setFilteredTradeList(excludeFilteredList);
    setFilteredOutPokemon(newlyFilteredOutPokemon);
    setUpdatedLocalTradeFilters({ ...updatedLocalTradeFilters });

  }, [
    selectedExcludeImages,
    selectedIncludeOnlyImages,
    listsState.trade,
    editMode
  ]);

  return { filteredTradeList, filteredOutPokemon, updatedLocalTradeFilters };
};

export default useTradeFiltering;
