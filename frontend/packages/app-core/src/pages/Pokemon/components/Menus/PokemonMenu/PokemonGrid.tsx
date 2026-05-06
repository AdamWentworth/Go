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
  enableInitialLayoutLoader?: boolean;
  onInitialLayoutReady?: () => void;
}

const BUFFER_ROWS = 5;
const ESTIMATED_ROW_HEIGHT = 150;
const MIN_ROW_HEIGHT = 100;
const GRID_REVEAL_DELAY_MS = 150;

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
  activeView,
  enableInitialLayoutLoader = true,
  onInitialLayoutReady,
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [measuredRowHeight, setMeasuredRowHeight] = useState(ESTIMATED_ROW_HEIGHT);
  const [isLayoutMeasured, setIsLayoutMeasured] = useState(!enableInitialLayoutLoader);
  const [isVisible, setIsVisible] = useState(!enableInitialLayoutLoader);
  const rowRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const measuredRowHeightRef = useRef(ESTIMATED_ROW_HEIGHT);
  const hasCompletedInitialLayoutRef = useRef(!enableInitialLayoutLoader);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const clearRevealTimer = useCallback(() => {
    if (revealTimerRef.current) {
      clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }
  }, []);

  const scheduleGridReveal = useCallback(() => {
    clearRevealTimer();
    revealTimerRef.current = setTimeout(() => {
      setIsVisible(true);
      hasCompletedInitialLayoutRef.current = true;
      onInitialLayoutReady?.();
      revealTimerRef.current = null;
    }, GRID_REVEAL_DELAY_MS);
  }, [clearRevealTimer, onInitialLayoutReady]);

  const setRowRef = useCallback((row: number, node: HTMLDivElement | null) => {
    if (node) {
      rowRefs.current.set(row, node);
    } else {
      rowRefs.current.delete(row);
    }
  }, []);

  useLayoutEffect(() => {
    measuredRowHeightRef.current = ESTIMATED_ROW_HEIGHT;
    setMeasuredRowHeight(ESTIMATED_ROW_HEIGHT);
  }, [columns]);

  useLayoutEffect(() => {
    if (enableInitialLayoutLoader) return;

    clearRevealTimer();
    hasCompletedInitialLayoutRef.current = true;
    setIsLayoutMeasured(true);
    setIsVisible(true);
  }, [clearRevealTimer, enableInitialLayoutLoader]);

  useLayoutEffect(() => {
    if (!hasRenderablePokemons) {
      clearRevealTimer();
      setIsLayoutMeasured(true);
      setIsVisible(true);
      return;
    }

    if (!hasCompletedInitialLayoutRef.current) {
      clearRevealTimer();
      setIsLayoutMeasured(false);
      setIsVisible(false);
    }
  }, [clearRevealTimer, hasRenderablePokemons]);

  useEffect(() => clearRevealTimer, [clearRevealTimer]);

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

    const rows = Array.from(rowRefs.current.values());
    if (!rows.length) return;

    const height = rows.reduce((maxHeight, rowEl) => {
      const style = window.getComputedStyle(rowEl);
      const marginTop = parseFloat(style.marginTop) || 0;
      const marginBottom = parseFloat(style.marginBottom) || 0;
      const gap = parseFloat(style.gap) || 8;
      const rowRect = rowEl.getBoundingClientRect();
      const cardBottom = Array.from(rowEl.querySelectorAll<HTMLElement>('.pokemon-card')).reduce(
        (bottom, card) => Math.max(bottom, card.getBoundingClientRect().bottom - rowRect.top),
        0,
      );
      const rowBoxHeight = Math.max(rowRect.height || rowEl.offsetHeight, cardBottom);

      return Math.max(maxHeight, rowBoxHeight + marginTop + marginBottom + gap);
    }, 0);

    if (height > 0) {
      const shouldGateBehindInitialLoader = !hasCompletedInitialLayoutRef.current;
      const rowHeightIncreased = height > measuredRowHeightRef.current + 0.5;
      if (rowHeightIncreased) {
        measuredRowHeightRef.current = height;
        if (shouldGateBehindInitialLoader) {
          setIsVisible(false);
        }
        setMeasuredRowHeight(height);
      }
      setIsLayoutMeasured(true);
      if (shouldGateBehindInitialLoader) {
        scheduleGridReveal();
      }
    }
  }, [hasRenderablePokemons, scheduleGridReveal]);

  const rowHeight = Math.max(measuredRowHeight, MIN_ROW_HEIGHT);
  const totalRows = Math.ceil(nonNullPokemons.length / columns);
  const totalHeight = totalRows * rowHeight;

  const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - BUFFER_ROWS);
  const endRow = Math.min(
    totalRows,
    Math.ceil((scrollTop + containerHeight) / rowHeight) + BUFFER_ROWS
  );
  const isGridReady = !enableInitialLayoutLoader || (isLayoutMeasured && isVisible);

  useLayoutEffect(() => {
    measureRowHeight();

    if (!hasRenderablePokemons) return undefined;

    const rows = Array.from(rowRefs.current.values());
    if (!rows.length) return undefined;

    const handleImageSettled = () => measureRowHeight();
    rows.forEach((rowEl) => {
      rowEl.addEventListener('load', handleImageSettled, true);
      rowEl.addEventListener('error', handleImageSettled, true);
    });

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => measureRowHeight());
      rows.forEach((rowEl) => resizeObserver?.observe(rowEl));
    }

    const timeout = setTimeout(measureRowHeight, 500);
    window.addEventListener('resize', measureRowHeight);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', measureRowHeight);
      rows.forEach((rowEl) => {
        rowEl.removeEventListener('load', handleImageSettled, true);
        rowEl.removeEventListener('error', handleImageSettled, true);
      });
      resizeObserver?.disconnect();
    };
  }, [columns, endRow, hasRenderablePokemons, measureRowHeight, sortedPokemons, startRow]);

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
        ref={(node) => setRowRef(row, node)}
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
      {enableInitialLayoutLoader && !isGridReady && (
        <AppLoadingFallback source="pokemon-grid-layout" />
      )}
      {visibleRows}
    </div>
  );
});

export default PokemonGrid;
