// useTradeFiltering.js – hardened version
// Goal: eliminate update-depth loop by (a) removing cyclic deps and (b) only
//       calling setLocalNotTradeList when the *result* differs, while also
//       being fully null-safe against missing lists/trade.
// ---------------------------------------------------------------------------
import { useMemo, useEffect } from 'react';
import filters from '../utils/tradeFilters';
import {
  EXCLUDE_IMAGES_trade,
  FILTER_NAMES_TRADE,
} from '../utils/constants';

// -------- helpers -----------------------------------------------------------
const deepClone = (obj) =>
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

const safeKeys = (obj) =>
  obj && typeof obj === 'object' ? Object.keys(obj) : [];

const safeEntries = (obj) =>
  obj && typeof obj === 'object' ? Object.entries(obj) : [];

const safeArray = (a) => (Array.isArray(a) ? a : []);

/* -------------------------------------------------------------------------- */
export default function useTradeFiltering(
  listsState,
  selectedExcludeImages,
  selectedIncludeOnlyImages,
  localTradeFilters,
  setLocalNotTradeList,
  localNotTradeList,
  editMode
) {
  /* ----------------------------------------------------------------------- */
  // 1️⃣ Compute filtered data (memoised) — fully null-safe
  /* ----------------------------------------------------------------------- */
  const memo = useMemo(() => {
    // Base trade map: may be missing if tags haven’t materialized a top-level "trade".
    const baseTrade =
      (listsState && listsState.trade && typeof listsState.trade === 'object')
        ? listsState.trade
        : {};

    // Writable copy only
    let updatedList = { ...baseTrade };
    const nextLocalTradeFilters = deepClone(localTradeFilters || {});

    const newlyFiltered = [];
    const reappeared = [];

    // Reset filter flags
    safeKeys(nextLocalTradeFilters).forEach((k) => {
      nextLocalTradeFilters[k] = false;
    });

    // ---------------- Exclude filters ------------------------------------
    safeArray(selectedExcludeImages).forEach((isSelected, idx) => {
      const name = FILTER_NAMES_TRADE[idx];
      const fn = filters[name];
      if (!fn) return;

      if (isSelected) {
        nextLocalTradeFilters[name] = true;
        updatedList = fn(updatedList) || {};
      } else {
        safeKeys(baseTrade).forEach((k) => {
          const after = fn(updatedList) || {};
          if (!after[k] && updatedList[k]) reappeared.push(k);
        });
      }
    });

    // Initially filtered by excludes
    safeKeys(baseTrade).forEach((k) => {
      if (!updatedList[k]) newlyFiltered.push(k);
    });

    // ---------------- Include-only filters (union) ------------------------
    if (safeArray(selectedIncludeOnlyImages).some(Boolean)) {
      const union = {};
      safeArray(selectedIncludeOnlyImages).forEach((isSelected, idx) => {
        const idxGlobal = EXCLUDE_IMAGES_trade.length + idx;
        const name = FILTER_NAMES_TRADE[idxGlobal];
        const fn = filters[name];
        if (!isSelected || !fn) return;

        nextLocalTradeFilters[name] = true;
        const partial = fn(baseTrade) || {};
        safeKeys(partial).forEach((k) => {
          if (partial[k] && updatedList[k]) union[k] = baseTrade[k];
        });
      });
      updatedList = union;
    }

    // Added by include-only filters
    safeKeys(baseTrade).forEach((k) => {
      if (!updatedList[k] && !newlyFiltered.includes(k)) newlyFiltered.push(k);
    });

    // Grey-out in view mode
    if (!editMode) {
      safeArray(newlyFiltered).forEach((k) => {
        if (!(localNotTradeList || {})[k]) {
          updatedList[k] = {
            ...baseTrade[k],
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
    listsState && listsState.trade, // track trade map changes
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
    localTradeFilters || {}
  )
    ? (localTradeFilters || {})
    : memo.nextLocalTradeFilters;

  /* ----------------------------------------------------------------------- */
  // 3️⃣ Sync not-trade list only when it *really* changes
  /* ----------------------------------------------------------------------- */
  useEffect(() => {
    if (editMode) return;

    if (memo.newlyFiltered.length === 0 && memo.reappeared.length === 0) return;

    setLocalNotTradeList((prev) => {
      const next = { ...(prev || {}) };
      let changed = false;

      memo.newlyFiltered.forEach((k) => {
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
