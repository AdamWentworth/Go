// src/hooks/useToggleEditModeTrade.ts

import { useState } from 'react';
import { updateNotTradeList } from '../utils/ReciprocalUpdate';
import { updateDisplayedList } from '../utils/listUtils';

import type { InstancesData } from '@/types/instances';
import type { TagBuckets } from '@/types/tags';
import type { PokemonVariant } from '@/types/pokemonVariants';

interface UseToggleEditModeTradeResult {
  editMode: boolean;
  toggleEditMode: () => void;
}

export const useToggleEditModeTrade = (
  pokemon: PokemonVariant,
  ownershipData: InstancesData,
  isMirror: boolean,
  mirrorKey: string | null,
  setMirrorKey: (key: string | null) => void,
  setIsMirror: (val: boolean) => void,
  lists: TagBuckets,
  listsState: any,
  setListsState: (val: any) => void,
  localNotWantedList: Record<string, boolean>,
  setLocalNotWantedList: (val: Record<string, boolean>) => void,
  localWantedFilters: Record<string, boolean>,
  updateDetails: (keys: string[] | string, updates: any) => void,
  filteredOutPokemon: string[]
): UseToggleEditModeTradeResult => {
  const [editMode, setEditMode] = useState<boolean>(false);

  const toggleEditMode = (): void => {
    const instanceData = pokemon.instanceData;
    if (!instanceData) return; // <- guard against undefined
  
    if (editMode) {
      const updatedNotWantedList = { ...localNotWantedList };
  
      filteredOutPokemon.forEach((key) => {
        updatedNotWantedList[key] = true;
      });
  
      const removedKeys = Object.keys(instanceData.not_wanted_list || {}).filter(
        (key) => !updatedNotWantedList[key]
      );
      const addedKeys = Object.keys(updatedNotWantedList).filter(
        (key) => !instanceData.not_wanted_list?.[key]
      );
  
      const updatesToApply: Record<string, any> = {};
  
      removedKeys.forEach((key) => {
        const updatedNotTradeList = updateNotTradeList(
          ownershipData,
          pokemon.pokemonKey,
          key,
          false
        );
        if (updatedNotTradeList) {
          updatesToApply[key] = { not_trade_list: updatedNotTradeList };
        }
      });
  
      addedKeys.forEach((key) => {
        const updatedNotTradeList = updateNotTradeList(
          ownershipData,
          pokemon.pokemonKey,
          key,
          true
        );
        if (updatedNotTradeList) {
          updatesToApply[key] = { not_trade_list: updatedNotTradeList };
        }
      });
  
      updatesToApply[pokemon.pokemonKey] = {
        not_wanted_list: updatedNotWantedList,
        wanted_filters: localWantedFilters,
        mirror: isMirror,
      };
  
      if (!isMirror && mirrorKey) {
        delete ownershipData[mirrorKey];
        delete lists.wanted[mirrorKey];
        updateDisplayedList(null, listsState, setListsState);
        setMirrorKey(null);
      }
  
      updateDetails([...removedKeys, ...addedKeys, pokemon.pokemonKey], updatesToApply);
      setLocalNotWantedList(updatedNotWantedList);
    } else {
      if (!isMirror && instanceData.mirror) {
        updateDetails(pokemon.pokemonKey, {
          ...instanceData,
          mirror: false,
        });
      }
    }
  
    setEditMode(!editMode);
    instanceData.not_wanted_list = localNotWantedList;
  };  

  return { editMode, toggleEditMode };
};

export default useToggleEditModeTrade;
