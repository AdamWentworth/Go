import { useState } from 'react';
import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { updateNotTradeList } from '../utils/ReciprocalUpdate';
import { updateDisplayedList } from '../utils/listUtils';
import { createScopedLogger } from '@/utils/logger';

type BooleanMap = Record<string, boolean>;
type WantedFilters = Record<string, unknown>;
type GenericMap = Record<string, unknown>;
type PatchMap = Record<string, GenericMap>;

type UpdateDetailsFn = (
  keyOrKeysOrMap: string | string[] | PatchMap,
  patch?: GenericMap,
) => Promise<void> | void;

type SetListsState = (updater: (prev: ListsState) => ListsState) => void;

interface ListsState {
  wanted: Record<string, unknown>;
  [key: string]: unknown;
}

interface PokemonLike {
  instanceData: {
    instance_id?: string;
    not_wanted_list?: BooleanMap;
    mirror?: boolean;
    [key: string]: unknown;
  };
  variant_id?: string;
  pokemonKey?: string;
}

const log = createScopedLogger('useToggleEditModeTrade');

/**
 * Provides edit mode state and a toggle handler for Trade -> Wanted editing.
 * When leaving edit mode, it builds a single patch map keyed by instance id.
 */
const useToggleEditModeTrade = (
  pokemon: PokemonLike,
  isMirror: boolean,
  mirrorKey: string | null,
  setMirrorKey: (value: string | null) => void,
  _setIsMirror: (value: boolean) => void,
  lists: ListsState,
  _listsState: ListsState,
  setListsState: SetListsState,
  localNotWantedList: BooleanMap,
  setLocalNotWantedList: (value: BooleanMap) => void,
  localWantedFilters: WantedFilters,
  updateDetails: UpdateDetailsFn,
  filteredOutPokemon: string[],
) => {
  const [editMode, setEditMode] = useState(false);
  const currentKey =
    pokemon.instanceData?.instance_id ?? pokemon.variant_id ?? pokemon.pokemonKey ?? '';
  const currentNotWantedList = pokemon.instanceData?.not_wanted_list ?? {};

  const instances = useInstancesStore.getState().instances as Record<string, GenericMap>;

  const toggleEditMode = () => {
    // Leaving edit mode: build patch map and persist.
    if (editMode) {
      const updatedNotWantedList: BooleanMap = { ...localNotWantedList };
      filteredOutPokemon.forEach((k) => {
        updatedNotWantedList[k] = true;
      });

      const removedKeys = Object.keys(currentNotWantedList).filter(
        (k) => !updatedNotWantedList[k],
      );
      const addedKeys = Object.keys(updatedNotWantedList).filter(
        (k) => !currentNotWantedList[k],
      );

      const patchMap: PatchMap = {};

      removedKeys.forEach((k) => {
        const next = updateNotTradeList(
          instances as Record<string, { not_trade_list?: BooleanMap } | undefined>,
          currentKey,
          k,
          false,
        );
        if (next) patchMap[k] = { not_trade_list: next };
      });

      addedKeys.forEach((k) => {
        const next = updateNotTradeList(
          instances as Record<string, { not_trade_list?: BooleanMap } | undefined>,
          currentKey,
          k,
          true,
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
        delete (lists.wanted as Record<string, unknown>)[mirrorKey];
        updateDisplayedList(null, localNotWantedList, setListsState);
        setMirrorKey(null);
      }

      log.debug('updateDetails patchMap', patchMap);
      void Promise.resolve(updateDetails(patchMap))
        .then(() => log.debug('updateDetails resolved'))
        .catch((err) => log.error('updateDetails failed', err));

      setLocalNotWantedList(updatedNotWantedList);
    } else if (!isMirror && pokemon.instanceData.mirror) {
      void Promise.resolve(
        updateDetails(currentKey, {
          ...pokemon.instanceData,
          mirror: false,
        }),
      );
    }

    setEditMode(!editMode);
  };

  return { editMode, toggleEditMode };
};

export default useToggleEditModeTrade;

