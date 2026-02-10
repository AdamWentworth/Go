// PokemonGrid.tsx

import React, { useState, useEffect, useRef, memo, useMemo } from 'react';
import PokemonCard from './PokemonCard';
import './PokemonGrid.css';

// Types
import type { PokemonVariant, AllVariants } from '@/types/pokemonVariants';
import type { SortType } from '@/types/sort';

// PokemonCard expects a variant with a defined currentImage
type CardPokemon = Omit<PokemonVariant, 'currentImage'> & { currentImage: string };

export interface PokemonGridProps {
  sortedPokemons: Array<CardPokemon | null>;
  highlightedCards: Set<string>;
  handleSelect: (pokemon: CardPokemon) => void;
  tagFilter: string;
  sortType: SortType;
  isEditable: boolean;
  toggleCardHighlight: (key: string) => void;
  setIsFastSelectEnabled: (enabled: boolean) => void;
  isFastSelectEnabled: boolean;
  variants: AllVariants;
  gridContainerRef: React.RefObject<HTMLDivElement>;
  activeView: string;
}

const BUFFER_ROWS = 5;

// Prefer instance UUIDs for React keys; fall back to variant key + index.
function buildReactKey(pokemon: any, absoluteIndex: number): string {
  // Use instance_id if available
  if (pokemon?.instanceData?.instance_id) return pokemon.instanceData.instance_id;
  if (pokemon?.instance_id) return pokemon.instance_id;

  // Fallback: use variant_id + index
  const variantKey = pokemon?.variant_id;

  return `${variantKey}#${absoluteIndex}`;
}

// Use instance id for highlighting if available; otherwise variant key
function getHighlightKey(pokemon: any): string | undefined {
  return pokemon?.instanceData?.instance_id ?? pokemon?.instance_id ?? pokemon?.variant_id;
}

const PokemonGrid: React.FC<PokemonGridProps> = memo(({
  sortedPokemons,
  highlightedCards,
  handleSelect,
  tagFilter,
  sortType,
  isEditable,
  toggleCardHighlight,
  setIsFastSelectEnabled,
  isFastSelectEnabled,
  variants,
  gridContainerRef,
  activeView
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [measuredRowHeight, setMeasuredRowHeight] = useState(150);
  const [isVisible, setIsVisible] = useState(false);
  const firstRowRef = useRef<HTMLDivElement>(null);

  const getColumns = () => {
    const width = window.innerWidth;
    if (width < 480) return 3;
    if (width < 1024) return 6;
    return 9;
  };
  const columns = getColumns();

  const nonNullPokemons = useMemo(
    () => sortedPokemons.filter((p): p is CardPokemon => Boolean(p)),
    [sortedPokemons]
  );

  const variantByPokemonId = useMemo(() => {
    const map = new Map<number, AllVariants[number]>();
    for (const variant of variants) {
      if (!map.has(variant.pokemon_id)) {
        map.set(variant.pokemon_id, variant);
      }
    }
    return map;
  }, [variants]);

  useEffect(() => {
    setIsVisible(false);
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, [activeView]);

  useEffect(() => {
    const container = gridContainerRef.current;
    if (!container) return;

    const handleScroll = () => setScrollTop(container.scrollTop);
    const resizeObserver = new ResizeObserver(([entry]) => {
      const height = entry.contentRect.height || window.innerHeight * 0.8;
      setContainerHeight(height);
    });

    container.addEventListener('scroll', handleScroll);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, [gridContainerRef]);

  useEffect(() => {
    if (gridContainerRef.current) {
      gridContainerRef.current.scrollTop = 0;
    }
    setScrollTop(0);
  }, [activeView, gridContainerRef]);

  useEffect(() => {
    const measureHeight = () => {
      const rowEl = firstRowRef.current;
      if (rowEl) {
        const style = window.getComputedStyle(rowEl);
        const marginTop = parseInt(style.marginTop) || 0;
        const marginBottom = parseInt(style.marginBottom) || 0;
        const gap = parseInt(style.gap) || 8;
        const height = rowEl.offsetHeight + marginTop + marginBottom + gap;
        setMeasuredRowHeight(height);
      }
    };

    measureHeight();
    const timeout = setTimeout(measureHeight, 500);
    window.addEventListener('resize', measureHeight);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', measureHeight);
    };
  }, [columns, sortedPokemons]);

  const rowHeight = Math.max(measuredRowHeight, 100);
  const totalRows = Math.ceil(nonNullPokemons.length / columns);
  const totalHeight = totalRows * rowHeight;

  const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - BUFFER_ROWS);
  const endRow = Math.min(
    totalRows,
    Math.ceil((scrollTop + containerHeight) / rowHeight) + BUFFER_ROWS
  );

  const visibleRows: React.ReactNode[] = [];
  for (let row = startRow; row < endRow; row++) {
    const startIndex = row * columns;
    const slice = nonNullPokemons.slice(startIndex, startIndex + columns);
    const rowPokemons: Array<CardPokemon | null> = [...slice];

    while (rowPokemons.length < columns) {
      rowPokemons.push(null);
    }

    visibleRows.push(
      <div
        key={`row-${row}`}
        ref={row === startRow ? firstRowRef : null}
        className="pokemon-grid-row"
        style={{ position: 'absolute', top: `${row * rowHeight}px`, width: '100%' }}
      >
        {rowPokemons.map((pokemon, i) => {
          const absoluteIndex = startIndex + i;
          const reactKey = pokemon ? buildReactKey(pokemon, absoluteIndex) : `empty-${absoluteIndex}`;
          const highlightKey = pokemon ? getHighlightKey(pokemon) : undefined;
          const isHighlighted = !!(highlightKey && highlightedCards.has(highlightKey));

          return (
            <div
              key={reactKey}
              className={`pokemon-grid-cell ${isVisible ? 'visible' : ''}`}
            >
              {pokemon && (
                <PokemonCard
                  pokemon={pokemon}
                  onSelect={() => handleSelect(pokemon)}
                  isHighlighted={isHighlighted}
                  tagFilter={tagFilter}
                  sortType={sortType}
                  isEditable={isEditable}
                  toggleCardHighlight={toggleCardHighlight}
                  setIsFastSelectEnabled={setIsFastSelectEnabled}
                  isFastSelectEnabled={isFastSelectEnabled}
                  variantByPokemonId={variantByPokemonId}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="pokemon-grid" style={{ position: 'relative', height: `${totalHeight}px` }}>
      {visibleRows}
    </div>
  );
});

export default PokemonGrid;
