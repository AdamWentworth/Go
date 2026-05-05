import React, { useMemo } from 'react';
import './TradeListDisplay.css';
import useSortManager from '@/hooks/sort/useSortManager';
import { useViewportBelow, VIEWPORT_BREAKPOINTS } from '@/hooks/useViewport';
import type { SortMode, SortType } from '@/types/sort';
import type { PokemonVariant } from '@/types/pokemonVariants';

type BooleanMap = Record<string, boolean>;

interface ParentPokemonRef {
  currentImage?: string;
  instanceData?: {
    instance_id?: string;
    variant_id?: string | null;
  };
}

interface TradeEntry {
  pokemon_id?: number;
  name?: string;
  species_name?: string;
  pokedex_number?: number;
  currentImage?: string;
  image_url?: string;
  image_url_shiny?: string;
  variant_id?: string | null;
  variantType?: string;
  form?: string | null;
  mirror?: boolean;
  [key: string]: unknown;
}

interface TradeDisplayItem extends TradeEntry {
  key: string;
  species_name: string;
}

interface TradeLists {
  trade?: Record<string, TradeEntry>;
}

interface TradeListDisplayProps {
  pokemon?: ParentPokemonRef;
  lists?: TradeLists;
  localNotTradeList: BooleanMap;
  setLocalNotTradeList: React.Dispatch<React.SetStateAction<BooleanMap>>;
  editMode: boolean;
  toggleReciprocalUpdates: (key: string, updatedNotTrade: boolean) => void;
  sortType: SortType;
  sortMode: SortMode;
  onPokemonClick?: (key: string) => void;
}

const extractBaseKey = (instanceId: string): string => {
  const parts = String(instanceId).split('_');
  parts.pop();
  return parts.join('_');
};

const resolveVariantKey = (
  fullKey: string,
  details?: { variant_id?: unknown } | null,
): string => {
  if (typeof details?.variant_id === 'string' && details.variant_id.length > 0) {
    return details.variant_id;
  }
  return extractBaseKey(fullKey);
};

const TradeListDisplay = ({
  pokemon,
  lists,
  localNotTradeList,
  setLocalNotTradeList,
  editMode,
  toggleReciprocalUpdates,
  sortType,
  sortMode,
  onPokemonClick,
}: TradeListDisplayProps) => {
  const isSmallScreen = useViewportBelow(VIEWPORT_BREAKPOINTS.desktop);
  const notTradeMap = localNotTradeList || {};
  const pokemonFullKey = pokemon?.instanceData?.instance_id ?? '';
  const pokemonBaseKey =
    pokemon?.instanceData?.variant_id ?? extractBaseKey(pokemonFullKey);

  const handleNotTradeToggle = (fullKey: string) => {
    if (!editMode) {
      return;
    }

    const updated = !notTradeMap[fullKey];
    setLocalNotTradeList((prev) => ({ ...prev, [fullKey]: updated }));
    toggleReciprocalUpdates(fullKey, updated);
  };

  const tradeEntries = useMemo(
    () => Object.entries(lists?.trade ?? {}),
    [lists],
  );

  const tradeListToDisplay = tradeEntries.filter(([fullKey, details]) => {
    const itemBaseKey = resolveVariantKey(fullKey, details);
    const mirrorOk = !details?.mirror || itemBaseKey === pokemonBaseKey;
    const isHidden =
      Boolean(notTradeMap[fullKey]) || Boolean(notTradeMap[itemBaseKey]);

    return (editMode || !isHidden) && mirrorOk;
  });

  const transformedTradeList: TradeDisplayItem[] = tradeListToDisplay.map(
    ([key, details]) => ({
      ...details,
      key,
      pokemon_id: details?.pokemon_id,
      name: details?.name,
      species_name: details?.species_name ?? details?.name ?? '',
      pokedex_number: details?.pokedex_number,
      image_url: details?.currentImage || pokemon?.currentImage,
      currentImage: details?.currentImage || pokemon?.currentImage,
      image_url_shiny:
        details?.image_url_shiny ||
        details?.currentImage ||
        pokemon?.currentImage,
    }),
  );

  const sortedTradeListToDisplay = useSortManager(
    transformedTradeList as unknown as PokemonVariant[],
    sortType,
    sortMode,
  ) as unknown as TradeDisplayItem[];

  if (!lists || sortedTradeListToDisplay.length === 0) {
    return <div>No Pokemon currently for trade.</div>;
  }

  let containerClass = '';
  if (sortedTradeListToDisplay.length > 30) {
    containerClass = 'xxlarge-list';
  } else if (sortedTradeListToDisplay.length > 15) {
    containerClass = 'xlarge-list';
  } else if (sortedTradeListToDisplay.length > 9) {
    containerClass = 'large-list';
  }

  const gridClass = isSmallScreen ? 'max-3-per-row' : '';

  return (
    <div className={`trade-list-container ${containerClass} ${gridClass}`}>
      {sortedTradeListToDisplay.map((tradePokemon) => {
        const isNotTrade =
          Boolean(notTradeMap[tradePokemon.key]) ||
          Boolean(notTradeMap[extractBaseKey(tradePokemon.key)]);
        const imageClasses = `trade-item-img ${isNotTrade ? 'grey-out' : ''}`;

        return (
          <div
            key={tradePokemon.key}
            className="trade-item"
            onClick={() => {
              if (!editMode) {
                onPokemonClick?.(tradePokemon.key);
              }
            }}
          >
            {tradePokemon.variantType?.includes('dynamax') && (
              <img
                src="/images/dynamax.png"
                alt="Dynamax"
                style={{
                  position: 'absolute',
                  top: 0,
                  right: '3%',
                  width: '30%',
                  height: 'auto',
                  zIndex: 0,
                }}
              />
            )}

            {tradePokemon.variantType?.includes('gigantamax') && (
              <img
                src="/images/gigantamax.png"
                alt="Gigantamax"
                style={{
                  position: 'absolute',
                  top: 0,
                  right: '3%',
                  width: '30%',
                  height: 'auto',
                  zIndex: 0,
                }}
              />
            )}

            <img
              src={tradePokemon.image_url ?? tradePokemon.currentImage}
              alt={`Trade Pokemon ${tradePokemon.name}`}
              className={imageClasses}
              title={`${tradePokemon.form ? `${tradePokemon.form} ` : ''}${tradePokemon.name ?? ''}`}
            />

            {editMode && (
              <button
                className="toggle-not-trade"
                onClick={() => handleNotTradeToggle(tradePokemon.key)}
              >
                {isNotTrade ? '\u2713' : 'X'}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TradeListDisplay;
