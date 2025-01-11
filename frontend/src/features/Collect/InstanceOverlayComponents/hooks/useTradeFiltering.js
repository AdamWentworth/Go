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
    let excludeFilteredList = {};
    const explicitlyFilteredOut = { ...localNotTradeList };
    const newlyFilteredOutPokemon = [];
    const reappearingPokemon = [];
    const updatedNotTradeList = { ...localNotTradeList };

    console.log("---- FILTERING START ----");
    console.log("Initial listsState.trade:", listsState.trade);
    console.log("Initial localNotTradeList:", localNotTradeList);

    const resetFilters = () => {
      Object.keys(updatedLocalTradeFilters).forEach((filterName) => {
        updatedLocalTradeFilters[filterName] = false;
      });
    };

    resetFilters();

    // Track which Pokémon pass each include filter
    const includeFilterResults = {};
    Object.keys(listsState.trade).forEach((key) => {
      includeFilterResults[key] = [];
    });

    // Apply include-only filters (OR logic: passes if it meets any include filter)
    const hasActiveIncludeFilters = selectedIncludeOnlyImages.some((isSelected) => isSelected);
    
    if (hasActiveIncludeFilters) {
      console.log("Applying include-only filters...");
      Object.keys(listsState.trade).forEach((key) => {
        let passesAnyIncludeFilter = false;

        selectedIncludeOnlyImages.forEach((isSelected, index) => {
          const filterName = FILTER_NAMES[index];
          if (isSelected && typeof filters[filterName] === 'function') {
            if (filters[filterName]({ [key]: listsState.trade[key] })[key]) {
              passesAnyIncludeFilter = true;
              includeFilterResults[key].push(filterName);
              updatedLocalTradeFilters[filterName] = true;
              
              // If this Pokémon was previously filtered out but now passes a filter,
              // add it to reappearing list
              if (localNotTradeList[key]) {
                reappearingPokemon.push(key);
              }
            }
          } else if (typeof filters[filterName] === 'function') {
            // Check if any pokemon would pass this filter if it was active
            if (filters[filterName]({ [key]: listsState.trade[key] })[key] && localNotTradeList[key]) {
              reappearingPokemon.push(key);
            }
          }
        });

        if (passesAnyIncludeFilter) {
          includeFilteredList[key] = listsState.trade[key];
          delete explicitlyFilteredOut[key];
          delete updatedNotTradeList[key];
        } else {
          updatedNotTradeList[key] = true;
        }
      });
    } else {
      includeFilteredList = { ...listsState.trade };
      // When no include filters are active, check if any Pokémon would reappear
      Object.keys(listsState.trade).forEach((key) => {
        if (localNotTradeList[key]) {
          reappearingPokemon.push(key);
        }
      });
    }

    // Copy includeFilteredList to start exclude filtering
    excludeFilteredList = { ...includeFilteredList };

    // Apply exclude filters
    selectedExcludeImages.forEach((isSelected, index) => {
      const filterName = FILTER_NAMES[INCLUDE_IMAGES_trade.length + index];
      if (isSelected && typeof filters[filterName] === 'function') {
        const filteredKeys = Object.keys(excludeFilteredList).filter(
          (key) => !filters[filterName]({ [key]: excludeFilteredList[key] })[key]
        );

        filteredKeys.forEach((key) => {
          explicitlyFilteredOut[key] = excludeFilteredList[key];
          newlyFilteredOutPokemon.push(key);
          delete excludeFilteredList[key];
          // Only add to notTradeList if it's not passing any include filters
          if (!includeFilterResults[key].length) {
            updatedNotTradeList[key] = true;
          }
        });

        updatedLocalTradeFilters[filterName] = true;
      } else {
        // When an exclude filter is deactivated, check if any previously filtered Pokémon would now pass
        Object.keys(listsState.trade).forEach((key) => {
          if (filters[filterName]({ [key]: listsState.trade[key] })[key] && localNotTradeList[key]) {
            if (!hasActiveIncludeFilters || includeFilterResults[key].length > 0) {
              reappearingPokemon.push(key);
            }
          }
        });
      }
    });

    // If in edit mode, grey out the filtered-out Pokémon
    if (editMode) {
      Object.keys(explicitlyFilteredOut).forEach((key) => {
        explicitlyFilteredOut[key] = { ...explicitlyFilteredOut[key], greyedOut: true };
      });
    }

    // Process reappearing Pokémon
    if (reappearingPokemon.length > 0) {
      console.log("Reappearing Pokémon detected:", reappearingPokemon);
      reappearingPokemon.forEach((key) => {
        delete updatedNotTradeList[key];
      });
    }

    // Update states
    setFilteredTradeList(excludeFilteredList);
    setFilteredOutPokemon(Object.keys(explicitlyFilteredOut));
    setUpdatedLocalTradeFilters({ ...updatedLocalTradeFilters });
    setLocalNotTradeList(updatedNotTradeList);

    console.log("---- FILTERING END ----");
    console.log("Reappearing Pokemon:", reappearingPokemon);
    console.log("Updated localNotTradeList:", updatedNotTradeList);
  }, [
    selectedExcludeImages,
    selectedIncludeOnlyImages,
    listsState.trade,
    editMode,
  ]);

  return { filteredTradeList, filteredOutPokemon, updatedLocalTradeFilters };
};

export default useTradeFiltering;