// PokemonGrid.tsx

import React, {
  useState,
  useEffect,
  useRef,
  memo,
  useMemo,
  useLayoutEffect,
  useCallback,
} from 'react';
import PokemonCard from './PokemonCard';
import './PokemonGrid.css';
import { AppLoadingFallback } from '@/contexts/AppLoadingContext';

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
const ESTIMATED_ROW_HEIGHT = 150;
const MIN_ROW_HEIGHT = 100;
const GRID_REVEAL_DELAY_MS = 50;

// Prefer instance UUIDs for React keys; fall back to variant key + index.
function buildReactKey(pokemon: CardPokemon, absoluteIndex: number): string {
  // Use instance_id if available
  if (pokemon?.instanceData?.instance_id) return pokemon.instanceData.instance_id;

  // Fallback: use variant_id + index
  const variantKey = pokemon?.variant_id;

  return `${variantKey}#${absoluteIndex}`;
}

// Use instance id for highlighting if available; otherwise variant key
function getHighlightKey(pokemon: CardPokemon): string {
  return pokemon.instanceData?.instance_id ?? pokemon.variant_id;
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
  const [measuredRowHeight, setMeasuredRowHeight] = useState(ESTIMATED_ROW_HEIGHT);
  const [isLayoutMeasured, setIsLayoutMeasured] = useState(false);
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
  const hasRenderablePokemons = nonNullPokemons.length > 0;

  const variantByPokemonId = useMemo(() => {
    const map = new Map<number, AllVariants[number]>();
    for (const variant of variants) {
      if (!map.has(variant.pokemon_id)) {
        map.set(variant.pokemon_id, variant);
      }
    }
    return map;
  }, [variants]);

  useLayoutEffect(() => {
    setIsLayoutMeasured(!hasRenderablePokemons);
    setIsVisible(false);
    if (!hasRenderablePokemons) {
      setIsVisible(true);
      return undefined;
    }

    const timer = setTimeout(() => setIsVisible(true), GRID_REVEAL_DELAY_MS);
    return () => clearTimeout(timer);
  }, [columns, hasRenderablePokemons]);

  useEffect(() => {
    const container = gridContainerRef.current;
    if (!container) return;

    const handleScroll = () => setScrollTop(container.scrollTop);
    const updateContainerHeight = (height?: number) => {
      const nextHeight = height || container.clientHeight || window.innerHeight * 0.8;
      setContainerHeight(nextHeight);
    };

    updateContainerHeight();
    container.addEventListener('scroll', handleScroll);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(([entry]) => {
        updateContainerHeight(entry.contentRect.height);
      });
      resizeObserver.observe(container);
    }

    return () => {
      container.removeEventListener('scroll', handleScroll);
      resizeObserver?.disconnect();
    };
  }, [gridContainerRef]);

  useEffect(() => {
    if (gridContainerRef.current) {
      gridContainerRef.current.scrollTop = 0;
    }
    setScrollTop(0);
  }, [activeView, gridContainerRef]);

  const measureRowHeight = useCallback(() => {
    if (!hasRenderablePokemons) {
      setIsLayoutMeasured(true);
      return;
    }

    const rowEl = firstRowRef.current;
    if (!rowEl) return;

    const style = window.getComputedStyle(rowEl);
    const marginTop = parseInt(style.marginTop) || 0;
    const marginBottom = parseInt(style.marginBottom) || 0;
    const gap = parseInt(style.gap) || 8;
    const rowBoxHeight = rowEl.getBoundingClientRect().height || rowEl.offsetHeight;
    const height = rowBoxHeight + marginTop + marginBottom + gap;

    if (height > 0) {
      setMeasuredRowHeight((prev) => (Math.abs(prev - height) > 0.5 ? height : prev));
      setIsLayoutMeasured(true);
    }
  }, [hasRenderablePokemons]);

  useLayoutEffect(() => {
    measureRowHeight();

    if (!hasRenderablePokemons) return undefined;

    const rowEl = firstRowRef.current;
    if (!rowEl) return undefined;

    const handleImageSettled = () => measureRowHeight();
    rowEl.addEventListener('load', handleImageSettled, true);
    rowEl.addEventListener('error', handleImageSettled, true);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => measureRowHeight());
      resizeObserver.observe(rowEl);
    }

    const timeout = setTimeout(measureRowHeight, 500);
    window.addEventListener('resize', measureRowHeight);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', measureRowHeight);
      rowEl.removeEventListener('load', handleImageSettled, true);
      rowEl.removeEventListener('error', handleImageSettled, true);
      resizeObserver?.disconnect();
    };
  }, [columns, measureRowHeight, sortedPokemons, hasRenderablePokemons]);

  const rowHeight = Math.max(measuredRowHeight, MIN_ROW_HEIGHT);
  const totalRows = Math.ceil(nonNullPokemons.length / columns);
  const totalHeight = totalRows * rowHeight;

  const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - BUFFER_ROWS);
  const endRow = Math.min(
    totalRows,
    Math.ceil((scrollTop + containerHeight) / rowHeight) + BUFFER_ROWS
  );
  const isGridReady = isLayoutMeasured && isVisible;

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
              className={`pokemon-grid-cell ${isGridReady ? 'visible' : ''}`}
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
      {!isGridReady && <AppLoadingFallback source="pokemon-grid-layout" />}
      {visibleRows}
    </div>
  );
});

export default PokemonGrid;
