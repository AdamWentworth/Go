import React, { useMemo } from 'react';
import './TradeTargetsList.css';
import useSortManager from '@/hooks/sort/useSortManager';
import { useViewportBelow, VIEWPORT_BREAKPOINTS } from '@/hooks/useViewport';
import type { SortMode, SortType } from '@/types/sort';
import type { PokemonVariant } from '@/types/pokemonVariants';
import TradeTargetListItem from './TradeTargetListItem';
import {
  filterVisibleTradeTargetEntries,
  resolveTradeTargetContainerClass,
  toTradeTargetDisplayItems,
  type LocalPokemonRef,
  type TradeTargetDisplayItem,
  type TradeTargetLists,
} from './tradeTargetsListState';

type BooleanMap = Record<string, boolean>;

interface TradeTargetsListProps {
  pokemon?: LocalPokemonRef;
  lists?: TradeTargetLists;
  localNotWantedList: BooleanMap;
  setLocalNotWantedList: React.Dispatch<React.SetStateAction<BooleanMap>>;
  isMirror: boolean;
  mirrorKey: string | null;
  editMode: boolean;
  toggleReciprocalUpdates: (key: string, updatedNotWanted: boolean) => void;
  sortType: SortType;
  sortMode: SortMode;
  onPokemonClick?: (key: string) => void;
}

const TradeTargetsList = ({
  pokemon,
  lists,
  localNotWantedList,
  setLocalNotWantedList,
  isMirror,
  mirrorKey,
  editMode,
  toggleReciprocalUpdates,
  sortType,
  sortMode,
  onPokemonClick,
}: TradeTargetsListProps) => {
  const isSmallScreen = useViewportBelow(VIEWPORT_BREAKPOINTS.desktop);
  const notWantedMap = localNotWantedList || {};

  const handleNotWantedToggle = (key: string) => {
    if (!editMode) {
      return;
    }

    const updatedNotWanted = !(notWantedMap[key] || false);
    setLocalNotWantedList((prev) => {
      if (updatedNotWanted) {
        return { ...prev, [key]: true };
      }
      const next = { ...prev };
      delete next[key];
      return next;
    });
    toggleReciprocalUpdates(key, updatedNotWanted);
  };

  const wantedEntries = useMemo(
    () => Object.entries(lists?.wanted ?? {}),
    [lists],
  );

  const transformedWantedList: TradeTargetDisplayItem[] = toTradeTargetDisplayItems(
    filterVisibleTradeTargetEntries(
      wantedEntries,
      notWantedMap,
      editMode,
      isMirror,
      mirrorKey,
    ),
    pokemon?.currentImage,
  );

  const sortedWantedListToDisplay = useSortManager(
    transformedWantedList as unknown as PokemonVariant[],
    sortType,
    sortMode,
  ) as unknown as TradeTargetDisplayItem[];

  const finalWantedListToDisplay = isMirror
    ? transformedWantedList
    : sortedWantedListToDisplay;

  if (!lists || finalWantedListToDisplay.length === 0) {
    return <div>No trade targets currently selected.</div>;
  }

  const containerClass = resolveTradeTargetContainerClass(
    isMirror,
    finalWantedListToDisplay.length,
  );
  const gridClass = isSmallScreen ? 'max-3-per-row' : '';

  return (
    <div className={`wanted-list-container ${containerClass} ${gridClass}`}>
      {finalWantedListToDisplay.map((wantedPokemon) => (
        <TradeTargetListItem
          key={wantedPokemon.key}
          wantedPokemon={wantedPokemon}
          isNotWanted={Boolean(notWantedMap[wantedPokemon.key])}
          editMode={editMode}
          onPokemonClick={onPokemonClick}
          onNotWantedToggle={handleNotWantedToggle}
        />
      ))}
    </div>
  );
};

export default TradeTargetsList;
