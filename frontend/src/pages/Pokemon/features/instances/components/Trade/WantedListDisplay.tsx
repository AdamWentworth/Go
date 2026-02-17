import React, { useEffect, useMemo, useState } from 'react';
import './WantedListDisplay.css';
import useSortManager from '@/hooks/sort/useSortManager';
import type { SortMode, SortType } from '@/types/sort';
import type { PokemonVariant } from '@/types/pokemonVariants';

type BooleanMap = Record<string, boolean>;

interface LocalPokemonRef {
  currentImage?: string;
}

interface WantedEntry {
  pokemon_id?: number;
  name?: string;
  species_name?: string;
  pokedex_number?: number;
  currentImage?: string;
  image_url?: string;
  image_url_shiny?: string;
  pref_lucky?: boolean;
  variantType?: string;
  form?: string | null;
  [key: string]: unknown;
}

interface WantedDisplayItem extends WantedEntry {
  key: string;
  species_name: string;
}

interface WantedLists {
  wanted?: Record<string, WantedEntry>;
}

interface WantedListDisplayProps {
  pokemon?: LocalPokemonRef;
  lists?: WantedLists;
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

const getIsSmallScreen = (): boolean =>
  typeof window !== 'undefined' ? window.innerWidth < 1024 : false;

const WantedListDisplay = ({
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
}: WantedListDisplayProps) => {
  const [isSmallScreen, setIsSmallScreen] = useState<boolean>(getIsSmallScreen);
  const notWantedMap = localNotWantedList || {};

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const wantedListToDisplay = wantedEntries.filter(([key]) => {
    const isVisible = editMode || !notWantedMap[key];
    const mirrorMatch = !isMirror || key === mirrorKey;
    return isVisible && mirrorMatch;
  });

  const transformedWantedList: WantedDisplayItem[] = wantedListToDisplay.map(
    ([key, details]) => ({
      ...details,
      key,
      pokemon_id: details?.pokemon_id,
      name: details?.name,
      species_name: details?.species_name ?? details?.name ?? '',
      pokedex_number: details?.pokedex_number,
      currentImage: details?.currentImage || pokemon?.currentImage,
      image_url: details?.currentImage || pokemon?.currentImage,
      image_url_shiny:
        details?.image_url_shiny ||
        details?.currentImage ||
        pokemon?.currentImage,
    }),
  );

  const sortedWantedListToDisplay = useSortManager(
    transformedWantedList as unknown as PokemonVariant[],
    sortType,
    sortMode,
  ) as unknown as WantedDisplayItem[];

  const finalWantedListToDisplay = isMirror
    ? transformedWantedList
    : sortedWantedListToDisplay;

  if (!lists || finalWantedListToDisplay.length === 0) {
    return <div>No Pokemon currently wanted.</div>;
  }

  let containerClass = '';
  if (isMirror) {
    containerClass = 'single-item-list';
  } else if (finalWantedListToDisplay.length > 30) {
    containerClass = 'xxlarge-list';
  } else if (finalWantedListToDisplay.length > 15) {
    containerClass = 'xlarge-list';
  } else if (finalWantedListToDisplay.length > 9) {
    containerClass = 'large-list';
  }

  const gridClass = isSmallScreen ? 'max-3-per-row' : '';

  return (
    <div className={`wanted-list-container ${containerClass} ${gridClass}`}>
      {finalWantedListToDisplay.map((wantedPokemon) => {
        const isNotWanted = Boolean(notWantedMap[wantedPokemon.key]);
        const imageClasses = `wanted-item-img ${isNotWanted ? 'grey-out' : ''}`;
        const backdropClasses = `lucky-backdrop ${isNotWanted ? 'grey-out' : ''}`;

        return (
          <div
            key={wantedPokemon.key}
            className="wanted-item"
            style={{ position: 'relative', overflow: 'hidden' }}
            onClick={() => {
              if (!editMode) {
                onPokemonClick?.(wantedPokemon.key);
              }
            }}
          >
            {wantedPokemon.pref_lucky && (
              <img
                src="/images/lucky.png"
                className={backdropClasses}
                alt="Lucky backdrop"
              />
            )}

            {wantedPokemon.variantType?.includes('dynamax') && (
              <img
                src="/images/dynamax.png"
                alt="Dynamax"
                style={{
                  position: 'absolute',
                  top: '0',
                  right: '3%',
                  width: '30%',
                  height: 'auto',
                  zIndex: 0,
                }}
              />
            )}

            {wantedPokemon.variantType?.includes('gigantamax') && (
              <img
                src="/images/gigantamax.png"
                alt="Gigantamax"
                style={{
                  position: 'absolute',
                  top: '0',
                  right: '3%',
                  width: '30%',
                  height: 'auto',
                  zIndex: 0,
                }}
              />
            )}

            <img
              src={wantedPokemon.currentImage}
              className={imageClasses}
              alt={`Wanted Pokemon ${wantedPokemon.name}`}
              style={{ zIndex: 2 }}
              title={`${wantedPokemon.form ? `${wantedPokemon.form} ` : ''}${wantedPokemon.name ?? ''}`}
            />

            {editMode && (
              <button
                className="toggle-not-wanted"
                onClick={() => handleNotWantedToggle(wantedPokemon.key)}
                style={{ zIndex: 3 }}
              >
                {isNotWanted ? '\u2713' : 'X'}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default WantedListDisplay;
