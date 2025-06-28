// useTradeFiltering.ts

import { useState, useEffect } from 'react';
import filters from '../utils/tradeFilters';
import { EXCLUDE_IMAGES_trade, FILTER_NAMES_TRADE } from '../utils/constants';
import type { TagBuckets, TagItem } from '@/types/tags';

type FilterFlags = Record<string, boolean>;

interface UseTradeFilteringResult {
  filteredTradeList: Record<string, TagItem>;
  filteredOutPokemon: string[];
  updatedLocalTradeFilters: FilterFlags;
}

// Cast filters to indexable signature
const typedFilters = filters as unknown as Record<
  string,
  (list: Record<string, TagItem>) => Record<string, TagItem>
>;

export default function useTradeFiltering(
  listsState: Pick<TagBuckets, 'trade'>, // Only pass trade bucket
  selectedExcludeImages: boolean[],
  selectedIncludeOnlyImages: boolean[],
  localTradeFilters: FilterFlags,
  setLocalNotTradeList: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
  localNotTradeList: Record<string, boolean>,
  editMode: boolean
): UseTradeFilteringResult {
  const [filteredTradeList, setFilteredTradeList] = useState<Record<string, TagItem>>(listsState.trade);
  const [filteredOutPokemon, setFilteredOutPokemon] = useState<string[]>([]);
  const [updatedLocalTradeFilters, setUpdatedLocalTradeFilters] = useState<FilterFlags>({
    ...localTradeFilters,
  });

  useEffect(() => {
    let updatedList = { ...listsState.trade };
    const newlyFilteredOutPokemon: string[] = [];
    const reappearingPokemon: string[] = [];

    // Reset filters
    Object.keys(updatedLocalTradeFilters).forEach((f) => {
      updatedLocalTradeFilters[f] = false;
    });

    // Exclude filters
    selectedExcludeImages.forEach((isSel, idx) => {
      const filterName = FILTER_NAMES_TRADE[idx];
      const fn = typedFilters[filterName];
      if (isSel && fn) {
        updatedList = fn(updatedList);
        updatedLocalTradeFilters[filterName] = true;
      } else if (fn) {
        Object.keys(listsState.trade).forEach((key) => {
          if (!fn(updatedList)[key] && updatedList[key]) {
            reappearingPokemon.push(key);
          }
        });
        updatedLocalTradeFilters[filterName] = false;
      }
    });

    // Track excluded
    Object.keys(listsState.trade).forEach((key) => {
      if (!updatedList[key]) newlyFilteredOutPokemon.push(key);
    });

    // Include-only (union)
    if (selectedIncludeOnlyImages.some((v) => v)) {
      const unionIncludeList: Record<string, TagItem> = {};
      selectedIncludeOnlyImages.forEach((isSel, idx) => {
        const filterIndex = EXCLUDE_IMAGES_trade.length + idx;
        const filterName = FILTER_NAMES_TRADE[filterIndex];
        const fn = typedFilters[filterName];
        if (isSel && fn) {
          const filteredByThis = fn(listsState.trade);
          Object.keys(filteredByThis).forEach((key) => {
            if (filteredByThis[key] && updatedList[key]) {
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

    // Track include-only excluded
    Object.keys(listsState.trade).forEach((key) => {
      if (!updatedList[key] && !newlyFilteredOutPokemon.includes(key)) {
        newlyFilteredOutPokemon.push(key);
      }
    });

    // Edit mode: grey out
    if (!editMode) {
      newlyFilteredOutPokemon.forEach((key) => {
        if (!localNotTradeList[key]) {
          updatedList[key] = { ...listsState.trade[key], greyedOut: true } as TagItem;
          setLocalNotTradeList((prev) => ({ ...prev, [key]: true }));
        }
      });
    }

    setFilteredTradeList(updatedList);
    setFilteredOutPokemon(newlyFilteredOutPokemon);
    setUpdatedLocalTradeFilters({ ...updatedLocalTradeFilters });

    // Handle reappearing
    if (reappearingPokemon.length) {
      const updatedNotTrade = { ...localNotTradeList };
      reappearingPokemon.forEach((key) => {
        delete updatedNotTrade[key];
      });
      // Optionally update setLocalNotTradeList if needed
    }
  }, [selectedExcludeImages, selectedIncludeOnlyImages, listsState.trade, editMode]);

  return { filteredTradeList, filteredOutPokemon, updatedLocalTradeFilters };
}
