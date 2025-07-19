// useTradeFiltering.js – 3rd revision
// Goal: eliminate update‑depth loop by (a) removing cyclic deps and (b) only
//       calling setLocalNotTradeList when the *result* differs.
// ---------------------------------------------------------------------------
import { useMemo, useEffect } from 'react';
import filters from '../utils/tradeFilters';
import {
  EXCLUDE_IMAGES_trade,
  FILTER_NAMES_TRADE,
} from '../utils/constants';

// -------- helpers -----------------------------------------------------------
const deepClone = obj =>
  typeof structuredClone === 'function'
    ? structuredClone(obj)
    : JSON.parse(JSON.stringify(obj));

const shallowEqualObj = (a, b) => {
  if (a === b) return true;
  if (!a || !b) return false;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const k of aKeys) if (a[k] !== b[k]) return false;
  return true;
};

// Simple value‑equality for arrays of strings (order‑insensitive)
const equalStringSets = (a, b) => {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  for (const v of b) if (!setA.has(v)) return false;
  return true;
};

/* -------------------------------------------------------------------------- */
export default function useTradeFiltering(
  listsState,
  selectedExcludeImages,
  selectedIncludeOnlyImages,
  localTradeFilters,
  setLocalNotTradeList,
  localNotTradeList,
  editMode,
) {
  /* ----------------------------------------------------------------------- */
  // 1️⃣ Compute filtered data (memoised)
  /* ----------------------------------------------------------------------- */
  const memo = useMemo(() => {
    // writable copies only
    let updatedList = { ...listsState.trade };
    const nextLocalTradeFilters = deepClone(localTradeFilters);

    const newlyFiltered = [];
    const reappeared = [];

    // Reset filter flags
    Object.keys(nextLocalTradeFilters).forEach(k => {
      nextLocalTradeFilters[k] = false;
    });

    // ---------------- Exclude filters ------------------------------------
    selectedExcludeImages.forEach((isSelected, idx) => {
      const name = FILTER_NAMES_TRADE[idx];
      const fn = filters[name];
      if (!fn) return;

      if (isSelected) {
        nextLocalTradeFilters[name] = true;
        updatedList = fn(updatedList);
      } else {
        Object.keys(listsState.trade).forEach(k => {
          if (!fn(updatedList)[k] && updatedList[k]) reappeared.push(k);
        });
      }
    });

    // Initially filtered by excludes
    Object.keys(listsState.trade).forEach(k => {
      if (!updatedList[k]) newlyFiltered.push(k);
    });

    // ---------------- Include‑only filters (union) ------------------------
    if (selectedIncludeOnlyImages.some(Boolean)) {
      const union = {};
      selectedIncludeOnlyImages.forEach((isSelected, idx) => {
        const idxGlobal = EXCLUDE_IMAGES_trade.length + idx;
        const name = FILTER_NAMES_TRADE[idxGlobal];
        const fn = filters[name];
        if (!isSelected || !fn) return;

        nextLocalTradeFilters[name] = true;
        const partial = fn(listsState.trade);
        Object.keys(partial).forEach(k => {
          if (partial[k] && updatedList[k]) union[k] = listsState.trade[k];
        });
      });
      updatedList = union;
    }

    // Added by include‑only filters
    Object.keys(listsState.trade).forEach(k => {
      if (!updatedList[k] && !newlyFiltered.includes(k)) newlyFiltered.push(k);
    });

    // Grey‑out in view mode
    if (!editMode) {
      newlyFiltered.forEach(k => {
        if (!localNotTradeList[k]) {
          updatedList[k] = {
            ...listsState.trade[k],
            greyedOut: true,
          };
        }
      });
    }

    return {
      filteredTradeList: updatedList,
      filteredOutPokemon: newlyFiltered,
      nextLocalTradeFilters,
      newlyFiltered,
      reappeared,
    };
  }, [
    listsState.trade,
    selectedExcludeImages,
    selectedIncludeOnlyImages,
    localTradeFilters,
    editMode,
    // ❌ deliberately *omit* localNotTradeList to break the cyclic setState loop
  ]);

  /* ----------------------------------------------------------------------- */
  // 2️⃣ Stable localTradeFilters reference
  /* ----------------------------------------------------------------------- */
  const stableTradeFilters = shallowEqualObj(
    memo.nextLocalTradeFilters,
    localTradeFilters,
  )
    ? localTradeFilters
    : memo.nextLocalTradeFilters;

  /* ----------------------------------------------------------------------- */
  // 3️⃣ Sync not‑trade list only when it *really* changes
  /* ----------------------------------------------------------------------- */
  useEffect(() => {
    if (editMode) return;

    if (memo.newlyFiltered.length === 0 && memo.reappeared.length === 0) return;

    setLocalNotTradeList(prev => {
      const next = { ...prev };
      let changed = false;

      memo.newlyFiltered.forEach(k => {
        if (!next[k]) {
          next[k] = true;
          changed = true;
        }
      });

      return changed ? next : prev; // React bails if same reference
    });
  }, [
    editMode,
    setLocalNotTradeList,
    // Depend on the *values* instead of references
    memo.newlyFiltered.length,
    memo.reappeared.length,
  ]);

  /* ----------------------------------------------------------------------- */
  // 4️⃣ Public API
  /* ----------------------------------------------------------------------- */
  return {
    filteredTradeList: memo.filteredTradeList,
    filteredOutPokemon: memo.filteredOutPokemon,
    updatedLocalTradeFilters: stableTradeFilters,
  };
}
