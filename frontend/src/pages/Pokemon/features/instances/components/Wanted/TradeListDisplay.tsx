// TradeListDisplay.tsx

import React, { useState, useEffect } from 'react';
import './TradeListDisplay.css';
import useSortManager from '@/hooks/sort/useSortManager';
import type { PokemonInstance } from '@/types/pokemonInstance';
import type { TagBuckets, TagItem } from '@/types/tags';
import type { SortType, SortMode } from '@/types/sort';
import type { PokemonVariant } from '@/types/pokemonVariants';

interface TradeListDisplayProps {
  pokemon: { instanceData?: PokemonInstance };
  lists: TagBuckets;
  localNotTradeList: Record<string, boolean>;
  setLocalNotTradeList: (val: Record<string, boolean>) => void;
  editMode: boolean;
  toggleReciprocalUpdates: (key: string, value: boolean) => void;
  sortType: SortType;
  sortMode: SortMode;
  onPokemonClick: (key: string) => void;
}

// Define a local type for display with key
type TradeDisplayItem = TagItem & { key: string };

const extractBaseKey = (pokemonKey: string): string => {
  const keyParts = String(pokemonKey).split('_');
  keyParts.pop();
  return keyParts.join('_');
};

const TradeListDisplay: React.FC<TradeListDisplayProps> = ({
  pokemon,
  lists,
  localNotTradeList,
  setLocalNotTradeList,
  editMode,
  toggleReciprocalUpdates,
  sortType,
  sortMode,
  onPokemonClick,
}) => {
  const [isSmallScreen, setIsSmallScreen] = useState<boolean>(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNotTradeToggle = (key: string) => {
    if (editMode) {
      const updatedNotTrade = !(localNotTradeList[key] || false);
      setLocalNotTradeList({ ...localNotTradeList, [key]: updatedNotTrade });
      toggleReciprocalUpdates(key, updatedNotTrade);
    }
  };

  const baseKey = extractBaseKey(pokemon.instanceData?.instance_id ?? '');

  const tradeListToDisplay = Object.entries(lists.trade)
    .filter(([key, details]) => {
      const itemBaseKey = extractBaseKey(key);
      const mirrorCondition = !details.mirror || (details.mirror && itemBaseKey === baseKey);
      return (!localNotTradeList[key] || editMode) && mirrorCondition;
    });

  const transformedTradeList: TradeDisplayItem[] = tradeListToDisplay.map(([key, details]) => ({
    ...details,
    key,
  }));

  const sortedTradeListToDisplay = useSortManager(
    transformedTradeList as unknown as PokemonVariant[], // force it here, not earlier
    sortType,
    sortMode
  );

  if (!lists || sortedTradeListToDisplay.length === 0) {
    return <div>No Pokémon currently for trade.</div>;
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
      {sortedTradeListToDisplay.map((pokemon: any) => {
        const isNotTrade = localNotTradeList[pokemon.key];
        const imageClasses = `trade-item-img ${isNotTrade ? 'grey-out' : ''}`;

        return (
          <div
            key={pokemon.key}
            className="trade-item"
            onClick={() => {
              if (!editMode) {
                console.log(`Clicked Pokemon Key: ${pokemon.key}`);
                onPokemonClick(pokemon.key);
              }
            }}
          >
            {/* Dynamax Icon */}
            {pokemon.variantType?.includes('dynamax') && (
              <img
                src={`/images/dynamax.png`}
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
            {/* Gigantamax Icon */}
            {pokemon.variantType?.includes('gigantamax') && (
              <img
                src={`/images/gigantamax.png`}
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
              src={pokemon.currentImage}
              alt={`Trade Pokémon ${pokemon.name}`}
              className={imageClasses}
              title={`${pokemon.form ? `${pokemon.form} ` : ''}${pokemon.name}`}
            />
            {editMode && (
              <button
                className="toggle-not-trade"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNotTradeToggle(pokemon.key);
                }}
              >
                {isNotTrade ? '✓' : 'X'}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TradeListDisplay;
