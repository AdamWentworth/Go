import { updateNotWantedList } from '../utils/ReciprocalUpdate';
import { createScopedLogger } from '@/utils/logger';

const log = createScopedLogger('useToggleEditModeWanted');

/**
 * Toggle edit mode for a Wanted entry and, when leaving edit mode,
 * build a per-instance patch map in the same shape used by OwnedInstance.
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
}) => {
  const instancesMap = instances ?? {};
  const currentKey =
    pokemon.instanceData?.instance_id ?? pokemon.variant_id ?? pokemon.pokemonKey;

  log.debug('toggleEditMode start', {
    enteringEdit: !editMode,
    pokemonKey: currentKey,
  });

  // Leaving edit mode: build patch map and persist.
  if (editMode) {
    const updatedNotTradeList = { ...localNotTradeList };
    filteredOutPokemon.forEach((k) => {
      updatedNotTradeList[k] = true;
    });

    const removedKeys = Object.keys(pokemon.instanceData.not_trade_list).filter(
      (k) => !updatedNotTradeList[k],
    );
    const addedKeys = Object.keys(updatedNotTradeList).filter(
      (k) => !pokemon.instanceData.not_trade_list[k],
    );

    const patchMap = {};

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

    updateDetails(patchMap)
      .then(() => log.debug('updateDetails resolved'))
      .catch((err) => log.error('updateDetails failed', err));

    setLocalNotTradeList(updatedNotTradeList);
  }

  setEditMode(!editMode);
};

