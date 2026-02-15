import { useState } from 'react';
import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { updateNotTradeList } from '../utils/ReciprocalUpdate';
import { updateDisplayedList } from '../utils/listUtils';
import { createScopedLogger } from '@/utils/logger';

const log = createScopedLogger('useToggleEditModeTrade');

/**
 * Provides edit mode state and a toggle handler for Trade -> Wanted editing.
 * When leaving edit mode, it builds a single patch map keyed by instance id.
 */
const useToggleEditModeTrade = (
  pokemon,
  isMirror,
  mirrorKey,
  setMirrorKey,
  setIsMirror,
  lists,
  listsState,
  setListsState,
  localNotWantedList,
  setLocalNotWantedList,
  localWantedFilters,
  updateDetails,
  filteredOutPokemon,
) => {
  const [editMode, setEditMode] = useState(false);
  const currentKey =
    pokemon.instanceData?.instance_id ?? pokemon.variant_id ?? pokemon.pokemonKey;

  const instances = useInstancesStore.getState().instances;

  const toggleEditMode = () => {
    // Leaving edit mode: build patch map and persist.
    if (editMode) {
      const updatedNotWantedList = { ...localNotWantedList };
      filteredOutPokemon.forEach((k) => {
        updatedNotWantedList[k] = true;
      });

      const removedKeys = Object.keys(pokemon.instanceData.not_wanted_list).filter(
        (k) => !updatedNotWantedList[k],
      );
      const addedKeys = Object.keys(updatedNotWantedList).filter(
        (k) => !pokemon.instanceData.not_wanted_list[k],
      );

      const patchMap = {};

      removedKeys.forEach((k) => {
        const next = updateNotTradeList(
          instances,
          currentKey,
          k,
          false,
          isMirror,
        );
        if (next) patchMap[k] = { not_trade_list: next };
      });

      addedKeys.forEach((k) => {
        const next = updateNotTradeList(
          instances,
          currentKey,
          k,
          true,
          isMirror,
        );
        if (next) patchMap[k] = { not_trade_list: next };
      });

      patchMap[currentKey] = {
        not_wanted_list: updatedNotWantedList,
        wanted_filters: localWantedFilters,
        mirror: isMirror,
      };

      if (!isMirror && mirrorKey) {
        delete instances[mirrorKey];
        delete lists.wanted[mirrorKey];
        updateDisplayedList(null, localNotWantedList, setListsState);
        setMirrorKey(null);
      }

      log.debug('updateDetails patchMap', patchMap);
      updateDetails(patchMap)
        .then(() => log.debug('updateDetails resolved'))
        .catch((err) => log.error('updateDetails failed', err));

      setLocalNotWantedList(updatedNotWantedList);
    } else if (!isMirror && pokemon.instanceData.mirror) {
      updateDetails(currentKey, {
        ...pokemon.instanceData,
        mirror: false,
      });
    }

    setEditMode(!editMode);
  };

  return { editMode, toggleEditMode };
};

export default useToggleEditModeTrade;

