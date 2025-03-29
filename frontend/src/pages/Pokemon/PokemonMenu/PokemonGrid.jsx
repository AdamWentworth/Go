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
  const [measuredRowHeight, setMeasuredRowHeight] = useState(cardHeight);
  const firstItemRef = useRef(null);

  // Scroll and resize listeners
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

  // Measure actual row height
  useEffect(() => {
    if (firstItemRef.current) {
      const item = firstItemRef.current;
      const style = window.getComputedStyle(item.parentElement);
      const rowGap = parseInt(style.gridRowGap) || 0;
      setMeasuredRowHeight(item.offsetHeight + rowGap);
    }
  }, [columns, cardHeight]);

  const rowHeight = measuredRowHeight || cardHeight;
  const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - BUFFER_ROWS);
  const endRow = Math.ceil((scrollTop + containerHeight) / rowHeight) + BUFFER_ROWS;
  
  // Calculate indices ensuring we don't skip the first item
  const startIndex = startRow * columns;
  const endIndex = Math.min(endRow * columns, totalItems);
  
  // Generate grid items
  const visiblePokemons = sortedPokemons.slice(startIndex, endIndex);
  
  // Calculate spacer heights
  const topSpacerHeight = startRow > 0 ? startRow * rowHeight : 0;
  const bottomSpacerHeight = Math.max(0, ((totalItems - endIndex) / columns) * rowHeight);

  return (
    <div className="pokemon-grid">
      {startRow > 0 && <div style={{ height: `${topSpacerHeight}px` }} />}
      {visiblePokemons.map((pokemon, index) => (
        <PokemonCard
          key={pokemon.pokemonKey}
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
      ))}
      <div style={{ height: `${bottomSpacerHeight}px` }} />
    </div>
  );
});

export default PokemonGrid;