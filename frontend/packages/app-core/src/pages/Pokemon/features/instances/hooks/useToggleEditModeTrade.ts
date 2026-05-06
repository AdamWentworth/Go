import { useState } from 'react';
import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { updateNotTradeList } from '../utils/ReciprocalUpdate';
import { updateDisplayedList } from '../utils/listUtils';
import { createScopedLogger } from '@/utils/logger';
import {
  buildMirrorInstance,
  type MirrorSourcePokemon,
} from '../utils/createMirrorEntry';
import {
  enrichMirrorInstanceForDisplay,
  findExistingMirrorKey,
  type MirrorPokemon,
} from '../components/Trade/mirrorManagerState';
import type { PokemonInstance } from '@/types/pokemonInstance';

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
  currentImage?: string;
  image_url?: string;
  pokemon_id?: number | string;
  pokedex_number?: number | string;
  species_name?: string;
  name?: string;
  variant_id?: string;
  variantType?: string;
  instanceData: {
    instance_id?: string;
    not_wanted_list?: BooleanMap;
    mirror?: boolean;
    variant_id?: string;
    pokemon_id?: number | string;
    [key: string]: unknown;
  };
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
  _lists: ListsState,
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
    pokemon.instanceData?.instance_id ?? pokemon.variant_id ?? '';
  const currentNotWantedList = pokemon.instanceData?.not_wanted_list ?? {};

  const toggleEditMode = () => {
    // Leaving edit mode: build patch map and persist.
    if (editMode) {
      const instances = useInstancesStore.getState().instances as Record<string, PokemonInstance>;
      const mirrorInstanceMap = instances as Record<string, PokemonInstance>;
      let resolvedMirrorKey: string | null = null;
      let createdMirrorInstance: PokemonInstance | null = null;

      if (isMirror) {
        if (mirrorKey && mirrorInstanceMap[mirrorKey]) {
          resolvedMirrorKey = mirrorKey;
        } else {
          const existingMirrorKey = findExistingMirrorKey({
            pokemon: pokemon as unknown as MirrorPokemon,
            instanceMap: mirrorInstanceMap,
          });

          if (existingMirrorKey) {
            resolvedMirrorKey = existingMirrorKey;
          } else {
            const nextMirrorInstance = buildMirrorInstance(
              pokemon as unknown as MirrorSourcePokemon,
              mirrorKey && !mirrorInstanceMap[mirrorKey] ? mirrorKey : undefined,
            ) as PokemonInstance;
            resolvedMirrorKey = nextMirrorInstance.instance_id ?? null;
            createdMirrorInstance = nextMirrorInstance;
          }
        }
      }

      const updatedNotWantedList: BooleanMap = isMirror ? {} : { ...localNotWantedList };
      if (!isMirror) {
        filteredOutPokemon.forEach((k) => {
          updatedNotWantedList[k] = true;
        });
      } else if (resolvedMirrorKey) {
        delete updatedNotWantedList[resolvedMirrorKey];
      }

      const removedKeys = Object.keys(currentNotWantedList).filter(
        (k) => !updatedNotWantedList[k],
      );
      const addedKeys = Object.keys(updatedNotWantedList).filter(
        (k) => !currentNotWantedList[k],
      );

      const patchMap: PatchMap = {};

      if (createdMirrorInstance && resolvedMirrorKey) {
        patchMap[resolvedMirrorKey] = createdMirrorInstance;
        setListsState((prev) => ({
          ...prev,
          wanted: {
            ...prev.wanted,
            [resolvedMirrorKey]: enrichMirrorInstanceForDisplay(
              createdMirrorInstance,
              pokemon as unknown as MirrorPokemon,
            ),
          },
        }));
      }

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
        wanted_filters: isMirror ? {} : localWantedFilters,
        mirror: isMirror,
      };

      if (isMirror && resolvedMirrorKey) {
        setMirrorKey(resolvedMirrorKey);
      }

      if (!isMirror && mirrorKey) {
        updateDisplayedList(null, localNotWantedList, setListsState);
        setMirrorKey(null);
      }

      log.debug('updateDetails patchMap', patchMap);
      void Promise.resolve(updateDetails(patchMap))
        .then(() => log.debug('updateDetails resolved'))
        .catch((err) => log.error('updateDetails failed', err));

      setLocalNotWantedList(updatedNotWantedList);
    }

    setEditMode(!editMode);
  };

  return { editMode, toggleEditMode };
};

export default useToggleEditModeTrade;
