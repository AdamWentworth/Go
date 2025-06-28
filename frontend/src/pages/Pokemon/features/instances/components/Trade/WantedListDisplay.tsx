/* ------------------------------------------------------------------ */
/*  WantedListDisplay.tsx                                             */
/* ------------------------------------------------------------------ */

import React, { useEffect, useState } from 'react';
import './WantedListDisplay.css';

import useSortManager from '@/hooks/sort/useSortManager';

import type { SortType, SortMode } from '@/types/sort';
import type { PokemonInstance } from '@/types/pokemonInstance';
import type { PokemonVariant }   from '@/types/pokemonVariants';

/* ---------------- helper types ----------------------------------- */

export interface WantedEntry {
  pokemon_id: number;
  name: string;
  pokedex_number: number;
  currentImage?: string;
  image_url_shiny?: string;
  pref_lucky?: boolean;
  variantType?: string;
  [key: string]: unknown;
}

type DisplayItem = WantedEntry & {
  key: string;
  image_url: string | undefined;
  image_url_shiny?: string;
};

export interface ListBag {
  wanted: Record<string, WantedEntry>;
}

/* ---------------- component props -------------------------------- */
interface WantedListDisplayProps {
  pokemon: PokemonVariant & { instanceData: PokemonInstance };
  lists: ListBag;

  localNotWantedList: Record<string, boolean>;
  setLocalNotWantedList: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;

  isMirror: boolean;
  mirrorKey?: string;
  editMode: boolean;

  instances: PokemonInstance[];                // kept for future use
  toggleReciprocalUpdates: (key: string, value: boolean) => void;

  sortType: SortType;
  sortMode: SortMode;

  onPokemonClick: (key: string) => void;
  variants?: any[]; 
}

/* ------------------------------------------------------------------ */
const WantedListDisplay: React.FC<WantedListDisplayProps> = ({
  pokemon,
  lists,
  localNotWantedList,
  setLocalNotWantedList,
  isMirror,
  mirrorKey,
  editMode,
  /* instances not used by this component now                      */
  toggleReciprocalUpdates,
  sortType,
  sortMode,
  onPokemonClick,
}) => {
  /* responsive --------------------------------------------------- */
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 1024);
  useEffect(() => {
    const resize = () => setIsSmallScreen(window.innerWidth < 1024);
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  /* toggle “not wanted” ------------------------------------------ */
  const handleNotWantedToggle = (key: string) => {
    if (!editMode) return;

    const newVal = !(localNotWantedList[key] ?? false);
    newVal
      ? setLocalNotWantedList({ ...localNotWantedList, [key]: true })
      : setLocalNotWantedList((prev) => {
          const { [key]: _, ...rest } = prev;
          return rest;
        });

    toggleReciprocalUpdates(key, newVal);
  };

  /* build / sort list ------------------------------------------- */
  const wantedEntries = Object.entries(lists?.wanted ?? {}).filter(
    ([key]) =>
      (editMode || !localNotWantedList[key]) &&
      (!isMirror || key === mirrorKey),
  );

  const transformed: DisplayItem[] = wantedEntries.map(([key, entry]) => ({
    ...entry,
    key,
    image_url: entry.currentImage ?? pokemon.currentImage,
    image_url_shiny: entry.image_url_shiny ?? entry.currentImage,
  }));

  /* ---- sort with existing hook, then cast back ---------------- */
  const sorted = useSortManager(
    transformed as unknown as PokemonVariant[],
    sortType,
    sortMode,
  ) as unknown as DisplayItem[];

  const finalList = isMirror ? transformed : sorted;

  /* guard -------------------------------------------------------- */
  if (!finalList.length) {
    return <div>No Pokémon currently wanted.</div>;
  }

  /* dynamic classes --------------------------------------------- */
  let containerClass = '';
  if (isMirror)                containerClass = 'single-item-list';
  else if (finalList.length > 30) containerClass = 'xxlarge-list';
  else if (finalList.length > 15) containerClass = 'xlarge-list';
  else if (finalList.length >  9) containerClass = 'large-list';

  const gridClass = isSmallScreen ? 'max-3-per-row' : '';

  /* render ------------------------------------------------------- */
  return (
    <div className={`wanted-list-container ${containerClass} ${gridClass}`}>
      {finalList.map((p) => {
        const isNotWanted = localNotWantedList[p.key];
        const imgCls      = `wanted-item-img ${isNotWanted ? 'grey-out' : ''}`;
        const backdropCls = `lucky-backdrop  ${isNotWanted ? 'grey-out' : ''}`;

        return (
          <div
            key={p.key}
            className="wanted-item"
            style={{ position: 'relative', overflow: 'hidden' }}
            onClick={() => !editMode && onPokemonClick(p.key)}
          >
            {p.pref_lucky && (
              <img src="/images/lucky.png" className={backdropCls} alt="Lucky" />
            )}

            {p.variantType?.includes('dynamax') && (
              <img
                src="/images/dynamax.png"
                alt="Dynamax"
                style={{ position: 'absolute', top: 0, right: '3%', width: '30%' }}
              />
            )}
            {p.variantType?.includes('gigantamax') && (
              <img
                src="/images/gigantamax.png"
                alt="G-max"
                style={{ position: 'absolute', top: 0, right: '3%', width: '30%' }}
              />
            )}

            <img
              src={p.image_url ?? '/images/default/placeholder.png'}
              className={imgCls}
              alt={`Wanted Pokémon ${p.name}`}
              title={`${(p as any).form ? `${(p as any).form} ` : ''}${p.name}`}
              style={{ zIndex: 2 }}
            />

            {editMode && (
              <button
                className="toggle-not-wanted"
                onClick={() => handleNotWantedToggle(p.key)}
                style={{ zIndex: 3 }}
              >
                {isNotWanted ? '✓' : 'X'}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default WantedListDisplay;
