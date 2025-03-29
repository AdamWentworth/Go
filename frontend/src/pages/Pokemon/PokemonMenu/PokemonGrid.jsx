// PokemonGrid.jsx

import React, { useState, useEffect, useRef, memo } from 'react';
import PokemonCard from './PokemonCard';
import './PokemonGrid.css';

const BUFFER_ROWS = 3;

const PokemonGrid = memo(({
  sortedPokemons,
  highlightedCards,
  handleSelect,
  isShiny,
  showShadow,
  multiFormPokedexNumbers,
  ownershipFilter,
  showAll,
  sortType,
  isEditable,
  toggleCardHighlight,
  setIsFastSelectEnabled,
  isFastSelectEnabled,
  variants,
  totalItems,
  columns,
  cardHeight,
  gridContainerRef
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  // measuredRowHeight may include any margins if used by PokemonCard
  const [measuredRowHeight, setMeasuredRowHeight] = useState(cardHeight);
  const firstItemRef = useRef(null);

  // Listen to scroll events and measure container height.
  useEffect(() => {
    const container = gridContainerRef.current;
    if (!container) return;

    const handleScroll = () => setScrollTop(container.scrollTop);
    const resizeObserver = new ResizeObserver(([entry]) => {
      setContainerHeight(entry.contentRect.height);
    });

    container.addEventListener('scroll', handleScroll);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, [gridContainerRef]);

  useEffect(() => {
    // When sortedPokemons changes, reset the grid’s scroll position and internal state.
    if (gridContainerRef && gridContainerRef.current) {
      gridContainerRef.current.scrollTop = 0;
    }
    setScrollTop(0);
  }, [sortedPokemons, gridContainerRef]);  

  // Measure the height of a row based on the first item.
  useEffect(() => {
    if (firstItemRef.current) {
      const item = firstItemRef.current;
      // Here we try to include any vertical spacing (for example, margin-bottom)
      const style = window.getComputedStyle(item);
      const marginBottom = parseInt(style.marginBottom) || 0;
      setMeasuredRowHeight(item.offsetHeight + marginBottom);
    }
  }, [columns, cardHeight]);

  useEffect(() => {
    const measureHeight = () => {
      if (firstItemRef.current) {
        const item = firstItemRef.current;
        const style = window.getComputedStyle(item);
        const marginBottom = parseInt(style.marginBottom) || 0;
        setMeasuredRowHeight(item.offsetHeight + marginBottom);
      }
    };
  
    // Initial measurement
    measureHeight();
  
    // Re-measure after a delay to account for late-loading content (e.g. images)
    const timeout = setTimeout(() => {
      measureHeight();
    }, 100); // You can adjust the delay as needed
  
    return () => clearTimeout(timeout);
  }, [columns, cardHeight]);  

  const rowHeight = (measuredRowHeight || cardHeight) + 10;
  const totalRows = Math.ceil(totalItems / columns);
  const totalHeight = totalRows * rowHeight + 100;

  // Determine which rows should be visible.
  const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - BUFFER_ROWS);
  const endRow = Math.min(
    totalRows,
    Math.ceil((scrollTop + containerHeight) / rowHeight) + BUFFER_ROWS
  );

  const startIndex = startRow * columns;
  const endIndex = Math.min(endRow * columns, totalItems);

  const visiblePokemons = sortedPokemons.slice(startIndex, endIndex);

  return (
    <div
      className="pokemon-grid"
      style={{ position: 'relative', height: `${totalHeight}px` }}
    >
      {visiblePokemons.map((pokemon, i) => {
        const index = startIndex + i;
        const row = Math.floor(index / columns);
        const col = index % columns;
        return (
          <div
            key={pokemon.pokemonKey}
            ref={i === 0 ? firstItemRef : null}
            style={{
              position: 'absolute',
              top: `${row * rowHeight}px`,
              left: `${(col * 100) / columns}%`,
              width: `${100 / columns}%`,
            }}
          >
            <PokemonCard
              pokemon={pokemon}
              onSelect={() => handleSelect(pokemon)}
              isHighlighted={highlightedCards.has(pokemon.pokemonKey)}
              isShiny={isShiny}
              showShadow={showShadow}
              multiFormPokedexNumbers={multiFormPokedexNumbers}
              ownershipFilter={ownershipFilter}
              showAll={showAll}
              sortType={sortType}
              isEditable={isEditable}
              toggleCardHighlight={toggleCardHighlight}
              setIsFastSelectEnabled={setIsFastSelectEnabled}
              isFastSelectEnabled={isFastSelectEnabled}
              variants={variants}
            />
          </div>
        );
      })}
    </div>
  );
});

export default PokemonGrid;