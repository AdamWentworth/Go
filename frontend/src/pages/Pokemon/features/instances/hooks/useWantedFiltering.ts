// useWantedFiltering.ts

import { useState, useEffect } from 'react';
import filters from '../utils/wantedFilters';
import {
  EXCLUDE_IMAGES_wanted,
  FILTER_NAMES,
} from '../utils/constants';

interface PokemonDetails {
  [key: string]: unknown;
}

interface ListsState {
  wanted: Record<string, PokemonDetails>;
}

type FilterFlags = Record<string, boolean>;

interface UseWantedFilteringResult {
  filteredWantedList: Record<string, PokemonDetails>;
  filteredOutPokemon: string[];
  updatedLocalWantedFilters: FilterFlags;
}

// Cast filters via unknown to get an index signature
const typedFilters = (filters as unknown) as Record<
  string,
  (pokemonList: Record<string, PokemonDetails>) => Record<string, PokemonDetails>
>;

export default function useWantedFiltering(
  listsState: ListsState,
  selectedExcludeImages: boolean[],
  selectedIncludeOnlyImages: boolean[],
  localWantedFilters: FilterFlags,
  setLocalNotWantedList: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
  localNotWantedList: Record<string, boolean>,
  editMode: boolean
): UseWantedFilteringResult {
  const [filteredWantedList, setFilteredWantedList] = useState(listsState.wanted);
  const [filteredOutPokemon, setFilteredOutPokemon] = useState<string[]>([]);
  const [updatedLocalWantedFilters, setUpdatedLocalWantedFilters] = useState<FilterFlags>({
    ...localWantedFilters,
  });

  useEffect(() => {
    let updatedList = { ...listsState.wanted };
    const newlyFilteredOutPokemon: string[] = [];
    const reappearingPokemon: string[] = [];

    // Reset all filters to false
    Object.keys(updatedLocalWantedFilters).forEach((filterName) => {
      updatedLocalWantedFilters[filterName] = false;
    });

    // Apply exclude filters
    selectedExcludeImages.forEach((isSelected, index) => {
      const filterName = FILTER_NAMES[index];
      const filterFn = typedFilters[filterName];
      if (isSelected && filterFn) {
        updatedList = filterFn(updatedList);
        updatedLocalWantedFilters[filterName] = true;
      } else if (filterFn) {
        Object.keys(listsState.wanted).forEach((key) => {
          if (!filterFn(updatedList)[key] && updatedList[key]) {
            reappearingPokemon.push(key);
          }
        });
        updatedLocalWantedFilters[filterName] = false;
      }
    });

    // Track excluded
    Object.keys(listsState.wanted).forEach((key) => {
      if (!updatedList[key]) {
        newlyFilteredOutPokemon.push(key);
      }
    });

    // Apply include-only (union) filters
    if (selectedIncludeOnlyImages.some((v) => v)) {
      const unionIncludeList: Record<string, PokemonDetails> = {};
      selectedIncludeOnlyImages.forEach((isSelected, idx) => {
        const filterIndex = EXCLUDE_IMAGES_wanted.length + idx;
        const filterName = FILTER_NAMES[filterIndex];
        const filterFn = typedFilters[filterName];
        if (isSelected && filterFn) {
          const filteredByThis = filterFn(listsState.wanted);
          Object.keys(filteredByThis).forEach((key) => {
            if (filteredByThis[key] && updatedList[key]) {
              unionIncludeList[key] = listsState.wanted[key];
            }
          });
          updatedLocalWantedFilters[filterName] = true;
        } else {
          updatedLocalWantedFilters[filterName] = false;
        }
      });
      updatedList = unionIncludeList;
    }

    // Track include-only excluded
    Object.keys(listsState.wanted).forEach((key) => {
      if (!updatedList[key] && !newlyFilteredOutPokemon.includes(key)) {
        newlyFilteredOutPokemon.push(key);
      }
    });

    // If editMode, grey out
    if (editMode) {
      newlyFilteredOutPokemon.forEach((key) => {
        if (!localNotWantedList[key]) {
          updatedList[key] = { ...listsState.wanted[key], greyedOut: true };
          setLocalNotWantedList((prev) => ({ ...prev, [key]: true }));
        }
      });
    }

    setFilteredWantedList(updatedList);
    setFilteredOutPokemon(newlyFilteredOutPokemon);
    setUpdatedLocalWantedFilters({ ...updatedLocalWantedFilters });

    // Handle reappearing
    if (reappearingPokemon.length > 0) {
      const updatedNotWanted = { ...localNotWantedList };
      reappearingPokemon.forEach((key) => {
        delete updatedNotWanted[key];
      });
      // setLocalNotWantedList(updatedNotWanted);
    }
  }, [
    selectedExcludeImages,
    selectedIncludeOnlyImages,
    listsState.wanted,
    editMode,
  ]);

  return { filteredWantedList, filteredOutPokemon, updatedLocalWantedFilters };
}
