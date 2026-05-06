import { updateNotWantedList } from '../utils/ReciprocalUpdate';
import { createScopedLogger } from '@/utils/logger';

type BooleanMap = Record<string, boolean>;
type InstanceMap = Record<string, { not_wanted_list?: BooleanMap } | undefined>;
type TradeFilters = Record<string, unknown>;
type PatchMap = Record<string, Record<string, unknown>>;

type UpdateDetailsFn = (
  keyOrKeysOrMap: string | string[] | PatchMap,
  patch?: Record<string, unknown>,
) => Promise<void> | void;

interface PokemonLike {
  instanceData?: {
    instance_id?: string;
    not_trade_list?: BooleanMap;
    [key: string]: unknown;
  };
  variant_id?: string;
}

interface ToggleEditModeWantedArgs {
  editMode: boolean;
  setEditMode: (value: boolean) => void;
  localNotTradeList: BooleanMap;
  setLocalNotTradeList: (value: BooleanMap) => void;
  pokemon: PokemonLike;
  instances?: InstanceMap;
  filteredOutPokemon: string[];
  localTradeFilters: TradeFilters;
  updateDetails: UpdateDetailsFn;
}

const log = createScopedLogger('useToggleEditModeWanted');

/**
 * Toggle edit mode for a Wanted entry and, when leaving edit mode,
 * build a per-instance patch map in the same shape used by CaughtInstance.
 */
export const toggleEditMode = ({
  editMode,
  setEditMode,
  localNotTradeList,
  setLocalNotTradeList,
  pokemon,
  instances,
  filteredOutPokemon,
  localTradeFilters,
  updateDetails,
}: ToggleEditModeWantedArgs): void => {
  const instancesMap = instances ?? {};
  const currentKey =
    pokemon.instanceData?.instance_id ?? pokemon.variant_id ?? '';
  const currentNotTradeList = pokemon.instanceData?.not_trade_list ?? {};

  log.debug('toggleEditMode start', {
    enteringEdit: !editMode,
    instanceId: currentKey,
  });

  // Leaving edit mode: build patch map and persist.
  if (editMode) {
    const updatedNotTradeList: BooleanMap = { ...localNotTradeList };
    filteredOutPokemon.forEach((k) => {
      updatedNotTradeList[k] = true;
    });

    const removedKeys = Object.keys(currentNotTradeList).filter(
      (k) => !updatedNotTradeList[k],
    );
    const addedKeys = Object.keys(updatedNotTradeList).filter(
      (k) => !currentNotTradeList[k],
    );

    const patchMap: PatchMap = {};

    removedKeys.forEach((k) => {
      const next = updateNotWantedList(instancesMap, currentKey, k, false);
      if (next) patchMap[k] = { not_wanted_list: next };
    });

    addedKeys.forEach((k) => {
      const next = updateNotWantedList(instancesMap, currentKey, k, true);
      if (next) patchMap[k] = { not_wanted_list: next };
    });

    patchMap[currentKey] = {
      not_trade_list: updatedNotTradeList,
      trade_filters: localTradeFilters,
    };

    log.debug('updateDetails patchMap', patchMap);

    void Promise.resolve(updateDetails(patchMap))
      .then(() => log.debug('updateDetails resolved'))
      .catch((err) => log.error('updateDetails failed', err));

    setLocalNotTradeList(updatedNotTradeList);
  }

  setEditMode(!editMode);
};
