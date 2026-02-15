import { useMemo, useEffect } from 'react';
import filters from '../utils/tradeFilters';
import {
  EXCLUDE_IMAGES_trade,
  FILTER_NAMES_TRADE,
} from '../utils/constants';

type TradeItem = Record<string, unknown> & {
  variantType?: string;
  shiny_rarity?: string;
  rarity?: string;
  location_card?: string | null;
  greyedOut?: boolean;
};

type TradeMap = Record<string, TradeItem>;

type ListsState = {
  trade?: TradeMap;
  [key: string]: unknown;
} | null | undefined;

type TradeFiltersState = Record<string, boolean>;
type TradeFilterFn = (list: TradeMap) => TradeMap;
const tradeFilterFns = filters as unknown as Record<string, TradeFilterFn>;

const deepClone = <T>(obj: T): T =>
  typeof structuredClone === 'function'
    ? structuredClone(obj)
    : JSON.parse(JSON.stringify(obj));

const shallowEqualObj = (
  a: Record<string, boolean> | null | undefined,
  b: Record<string, boolean> | null | undefined,
): boolean => {
  if (a === b) return true;
  if (!a || !b) return false;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const k of aKeys) if (a[k] !== b[k]) return false;
  return true;
};

const safeKeys = (obj: unknown): string[] =>
  obj && typeof obj === 'object' ? Object.keys(obj as object) : [];

const safeArray = (a: unknown): boolean[] => (Array.isArray(a) ? (a as boolean[]) : []);

type UseTradeFilteringResult = {
  filteredTradeList: TradeMap;
  filteredOutPokemon: string[];
  updatedLocalTradeFilters: TradeFiltersState;
};

export default function useTradeFiltering(
  listsState: ListsState,
  selectedExcludeImages: boolean[],
  selectedIncludeOnlyImages: boolean[],
  localTradeFilters: TradeFiltersState,
  setLocalNotTradeList: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
  localNotTradeList: Record<string, boolean>,
  editMode: boolean,
): UseTradeFilteringResult {
  const memo = useMemo(() => {
    const baseTrade =
      listsState && listsState.trade && typeof listsState.trade === 'object'
        ? listsState.trade
        : {};

    let updatedList: TradeMap = { ...baseTrade };
    const nextLocalTradeFilters = deepClone(localTradeFilters || {});

    const newlyFiltered: string[] = [];
    const reappeared: string[] = [];

    safeKeys(nextLocalTradeFilters).forEach((k) => {
      nextLocalTradeFilters[k] = false;
    });

    safeArray(selectedExcludeImages).forEach((isSelected, idx) => {
      const name = FILTER_NAMES_TRADE[idx];
      const fn = tradeFilterFns[name];
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

    safeKeys(baseTrade).forEach((k) => {
      if (!updatedList[k]) newlyFiltered.push(k);
    });

    if (safeArray(selectedIncludeOnlyImages).some(Boolean)) {
      const union: TradeMap = {};
      safeArray(selectedIncludeOnlyImages).forEach((isSelected, idx) => {
        const idxGlobal = EXCLUDE_IMAGES_trade.length + idx;
        const name = FILTER_NAMES_TRADE[idxGlobal];
        const fn = tradeFilterFns[name];
        if (!isSelected || !fn) return;

        nextLocalTradeFilters[name] = true;
        const partial = fn(baseTrade) || {};
        safeKeys(partial).forEach((k) => {
          if (partial[k] && updatedList[k]) union[k] = baseTrade[k];
        });
      });
      updatedList = union;
    }

    safeKeys(baseTrade).forEach((k) => {
      if (!updatedList[k] && !newlyFiltered.includes(k)) newlyFiltered.push(k);
    });

    if (!editMode) {
      newlyFiltered.forEach((k) => {
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
    listsState && listsState.trade,
    selectedExcludeImages,
    selectedIncludeOnlyImages,
    localTradeFilters,
    editMode,
  ]);

  const stableTradeFilters = shallowEqualObj(
    memo.nextLocalTradeFilters,
    localTradeFilters || {},
  )
    ? localTradeFilters || {}
    : memo.nextLocalTradeFilters;

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

      return changed ? next : prev;
    });
  }, [
    editMode,
    setLocalNotTradeList,
    memo.newlyFiltered.length,
    memo.reappeared.length,
  ]);

  return {
    filteredTradeList: memo.filteredTradeList,
    filteredOutPokemon: memo.filteredOutPokemon,
    updatedLocalTradeFilters: stableTradeFilters,
  };
}
