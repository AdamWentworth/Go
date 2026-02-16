import { useState, useEffect } from 'react';
import filters from '../utils/wantedFilters';
import {
  EXCLUDE_IMAGES_wanted,
  FILTER_NAMES,
} from '../utils/constants';

type WantedItem = Record<string, unknown> & {
  shiny_rarity?: string;
  variantType?: string;
  rarity?: string;
  location_card?: string | null;
  greyedOut?: boolean;
};

type WantedMap = Record<string, WantedItem>;
type WantedFiltersState = Record<string, boolean>;
type WantedFilterFn = (list: WantedMap) => WantedMap;

type ListsState = {
  wanted?: WantedMap;
  [key: string]: unknown;
} | null | undefined;

const wantedFilterFns = filters as unknown as Record<string, WantedFilterFn>;

const asWantedMap = (value: unknown): WantedMap =>
  value && typeof value === 'object' ? (value as WantedMap) : {};

const useWantedFiltering = (
  listsState: ListsState,
  selectedExcludeImages: boolean[],
  selectedIncludeOnlyImages: boolean[],
  localWantedFilters: WantedFiltersState,
  setLocalNotWantedList: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
  localNotWantedList: Record<string, boolean>,
  editMode: boolean,
) => {
  const baseWanted = asWantedMap(listsState?.wanted);

  const [filteredWantedList, setFilteredWantedList] = useState<WantedMap>(baseWanted);
  const [filteredOutPokemon, setFilteredOutPokemon] = useState<string[]>([]);
  const [updatedLocalWantedFilters, setUpdatedLocalWantedFilters] = useState<WantedFiltersState>({
    ...localWantedFilters,
  });

  useEffect(() => {
    const wanted = asWantedMap(listsState?.wanted);
    let updatedList: WantedMap = { ...wanted };
    const newlyFilteredOutPokemon: string[] = [];
    const reappearingPokemon: string[] = [];
    const nextLocalWantedFilters: WantedFiltersState = { ...(localWantedFilters || {}) };

    // Initialize all existing filter keys to false.
    Object.keys(nextLocalWantedFilters).forEach((filterName) => {
      nextLocalWantedFilters[filterName] = false;
    });

    selectedExcludeImages.forEach((isSelected, index) => {
      const filterName = FILTER_NAMES[index];
      const filterFn = wantedFilterFns[filterName];
      if (!filterFn) return;

      if (isSelected) {
        updatedList = filterFn(updatedList) || {};
        nextLocalWantedFilters[filterName] = true;
      } else {
        Object.keys(wanted).forEach((key) => {
          const reevaluated = filterFn(updatedList) || {};
          if (!reevaluated[key] && updatedList[key]) {
            reappearingPokemon.push(key);
          }
        });
        nextLocalWantedFilters[filterName] = false;
      }
    });

    Object.keys(wanted).forEach((key) => {
      if (!updatedList[key]) {
        newlyFilteredOutPokemon.push(key);
      }
    });

    if (selectedIncludeOnlyImages.some((isSelected) => isSelected)) {
      const unionIncludeList: WantedMap = {};
      selectedIncludeOnlyImages.forEach((isSelected, index) => {
        const filterIndex = EXCLUDE_IMAGES_wanted.length + index;
        const filterName = FILTER_NAMES[filterIndex];
        const filterFn = wantedFilterFns[filterName];
        if (!filterFn) return;

        if (isSelected) {
          const filteredByThisInclude = filterFn(wanted) || {};
          Object.keys(filteredByThisInclude).forEach((key) => {
            if (filteredByThisInclude[key] && updatedList[key]) {
              unionIncludeList[key] = wanted[key];
            }
          });
          nextLocalWantedFilters[filterName] = true;
        } else {
          nextLocalWantedFilters[filterName] = false;
        }
      });

      updatedList = unionIncludeList;
    }

    Object.keys(wanted).forEach((key) => {
      if (!updatedList[key] && !newlyFilteredOutPokemon.includes(key)) {
        newlyFilteredOutPokemon.push(key);
      }
    });

    // Preserve legacy behavior: in edit mode, include filtered entries as greyedOut
    // and mark them in local not-wanted list.
    if (editMode) {
      newlyFilteredOutPokemon.forEach((key) => {
        if (!localNotWantedList[key]) {
          updatedList[key] = { ...wanted[key], greyedOut: true };
          setLocalNotWantedList((prev) => ({ ...prev, [key]: true }));
        }
      });
    }

    setFilteredWantedList(updatedList);
    setFilteredOutPokemon(newlyFilteredOutPokemon);
    setUpdatedLocalWantedFilters({ ...nextLocalWantedFilters });
  }, [
    selectedExcludeImages,
    selectedIncludeOnlyImages,
    listsState?.wanted,
    editMode,
  ]);

  return { filteredWantedList, filteredOutPokemon, updatedLocalWantedFilters };
};

export default useWantedFiltering;
