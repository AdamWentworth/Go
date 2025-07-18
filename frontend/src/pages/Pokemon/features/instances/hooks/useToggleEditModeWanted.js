// useToggleEditModeWanted.js
import { updateNotWantedList } from '../utils/ReciprocalUpdate.js';

/**
 * Toggle edit mode for a “Wanted” entry and, when leaving edit mode,
 * build a per‑instance patch map identical in shape to the one sent
 * by OwnedInstance.
 */
export const toggleEditMode = ({
  editMode,
  setEditMode,
  localNotTradeList,
  setLocalNotTradeList,
  pokemon,
  ownershipData,
  filteredOutPokemon,
  localTradeFilters,
  updateDetails,
}) => {
  /* ------------------------------------------------------------------ */
  // ENTER / EXIT
  /* ------------------------------------------------------------------ */
  console.log('[Wanted] toggleEditMode – start', {
    enteringEdit: !editMode,
    pokemonKey: pokemon.pokemonKey,
  });

  /* ------------------------------------------------------------------ */
  // LEAVING edit mode → construct patch map + save
  /* ------------------------------------------------------------------ */
  if (editMode) {
    // 1. Compose new not‑trade list for the *current* Pokémon
    const updatedNotTradeList = { ...localNotTradeList };
    filteredOutPokemon.forEach(k => {
      updatedNotTradeList[k] = true;
    });

    // 2. Detect which partner Pokémon need not_wanted_list changes
    const removedKeys = Object.keys(pokemon.instanceData.not_trade_list)
      .filter(k => !updatedNotTradeList[k]);
    const addedKeys = Object.keys(updatedNotTradeList)
      .filter(k => !pokemon.instanceData.not_trade_list[k]);

    // 3. Build the patch map (one entry per instance ID)
    const patchMap = {};

    //   3a. Partners we *removed* from not_trade_list → update their not_wanted_list
    removedKeys.forEach(k => {
      const next = updateNotWantedList(
        ownershipData,
        pokemon.pokemonKey,
        k,
        false,
      );
      if (next) patchMap[k] = { not_wanted_list: next };
    });

    //   3b. Partners we *added* → likewise
    addedKeys.forEach(k => {
      const next = updateNotWantedList(
        ownershipData,
        pokemon.pokemonKey,
        k,
        true,
      );
      if (next) patchMap[k] = { not_wanted_list: next };
    });

    //   3c. Primary Pokémon’s own patch
    patchMap[pokemon.pokemonKey] = {
      not_trade_list: updatedNotTradeList,
      trade_filters: localTradeFilters,
    };

    // 4.  Trace + send (single‑argument patch‑map, like OwnedInstance)
    console.log(
      '[Wanted → updateDetails] PATCH MAP ↓\n',
      JSON.stringify(patchMap, null, 2),
    );

    updateDetails(patchMap)
      .then(() => console.log('[Wanted] updateDetails ✅ resolved'))
      .catch(err => console.error('[Wanted] updateDetails ❌', err));

    // 5.  Update local UI copy immediately
    setLocalNotTradeList(updatedNotTradeList);
  }

  /* ------------------------------------------------------------------ */
  // Flip editMode flag
  /* ------------------------------------------------------------------ */
  setEditMode(!editMode);
};
