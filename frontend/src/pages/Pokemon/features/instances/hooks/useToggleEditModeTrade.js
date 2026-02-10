/* -------------------------------------------------------------------------
   useToggleEditModeTrade.js   —   “Trade” side of the reciprocal editor
   ------------------------------------------------------------------------- */

import { useState } from 'react';
import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { updateNotTradeList } from '../utils/ReciprocalUpdate';
import { updateDisplayedList } from '../utils/listUtils';

/**
 * Provides `editMode` state and `toggleEditMode` handler for the Trade ➜ Wanted
 * card. When the user leaves edit‑mode it builds a **single patch‑map** (one
 * entry per instance ID) and passes it to `updateInstanceDetails`, mirroring
 * the behaviour of `useToggleEditModeWanted`.
 */
const useToggleEditModeTrade = (
  /** the parent Pokémon object */                       pokemon,
  /** true when displaying a “mirror” (1‑for‑1) list */  isMirror,
  mirrorKey,
  setMirrorKey,
  setIsMirror,

  /* list props / setters */
  lists,
  listsState,
  setListsState,

  /* editable local state */
  localNotWantedList,
  setLocalNotWantedList,
  localWantedFilters,

  /* actions */
  updateDetails,

  /* derived data from useWantedFiltering */
  filteredOutPokemon,
) => {
  const [editMode, setEditMode] = useState(false);
  const currentKey =
    pokemon.instanceData?.instance_id ?? pokemon.variant_id ?? pokemon.pokemonKey;

  /* --------------------------------------------------------------------- */
  /*  Source of truth for ALL instance data                                */
  /* --------------------------------------------------------------------- */
  const ownershipData = useInstancesStore.getState().instances;

  /* --------------------------------------------------------------------- */
  /*  Main handler                                                         */
  /* --------------------------------------------------------------------- */
  const toggleEditMode = () => {
    /* Leaving edit‑mode → build patch‑map & persist -------------------- */
    if (editMode) {
      /* 1. Compose updated not_wanted_list for the CURRENT Pokémon ------ */
      const updatedNotWantedList = { ...localNotWantedList };
      filteredOutPokemon.forEach(k => (updatedNotWantedList[k] = true));

      /* 2. Keys that changed ------------------------------------------- */
      const removedKeys = Object.keys(pokemon.instanceData.not_wanted_list)
        .filter(k => !updatedNotWantedList[k]);
      const addedKeys = Object.keys(updatedNotWantedList)
        .filter(k => !pokemon.instanceData.not_wanted_list[k]);

      /* 3. Build ONE patch‑map ----------------------------------------- */
      const patchMap = {};

      /* 3a. Reciprocal edits on partner Pokémon ------------------------ */
      removedKeys.forEach(k => {
        const next = updateNotTradeList(
          ownershipData,           // live store map
          currentKey,      // current Pokémon
          k,                       // partner instance
          false,                   // remove link
          isMirror,
        );
        if (next) patchMap[k] = { not_trade_list: next };
      });

      addedKeys.forEach(k => {
        const next = updateNotTradeList(
          ownershipData,
          currentKey,
          k,
          true,                    // add link
          isMirror,
        );
        if (next) patchMap[k] = { not_trade_list: next };
      });

      /* 3b. Primary Pokémon’s own patch -------------------------------- */
      patchMap[currentKey] = {
        not_wanted_list: updatedNotWantedList,
        wanted_filters : localWantedFilters,
        mirror         : isMirror,
      };

      /* 4. Mirror housekeeping ----------------------------------------- */
      if (!isMirror && mirrorKey) {
        delete ownershipData[mirrorKey];
        delete lists.wanted[mirrorKey];
        updateDisplayedList(null, localNotWantedList, setListsState);
        setMirrorKey(null);
      }

      /* 5. Commit to store --------------------------------------------- */
      /*    Single‑argument overload: updateDetails(patchMap)             */
      console.log('[Trade → updateDetails] PATCH MAP ↓\n',
        JSON.stringify(patchMap, null, 2));

      updateDetails(patchMap)
        .then(() => console.log('[Trade] updateDetails ✅ resolved'))
        .catch(err => console.error('[Trade] updateDetails ❌', err));

      /* 6. Update local UI copy immediately ---------------------------- */
      setLocalNotWantedList(updatedNotWantedList);
    }

    /* ENTERING edit‑mode (or other misc exit tweaks) ------------------- */
    else {
      if (!isMirror && pokemon.instanceData.mirror) {
        updateDetails(currentKey, {
          ...pokemon.instanceData,
          mirror: false,
        });
      }
    }

    /* 7. Flip the flag ------------------------------------------------- */
    setEditMode(!editMode);
  };

  return { editMode, toggleEditMode };
};

export default useToggleEditModeTrade;

