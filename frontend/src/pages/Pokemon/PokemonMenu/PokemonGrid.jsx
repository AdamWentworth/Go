// PokemonGrid.jsx
import React, { memo, useCallback, useState, useEffect } from 'react';
import { FixedSizeGrid } from 'react-window';
import PokemonCard from './PokemonCard';
import './PokemonGrid.css'; // Import the CSS for scrollbar styling

// Hook to track window width (for responsiveness)
function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return width;
}

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
  variants
}) => {
  const windowWidth = useWindowWidth();

  // Determine the number of columns based on your CSS breakpoints:
  // - < 481px: 3 columns
  // - 481px - 1023px: 6 columns
  // - 1024px and up: 9 columns
  let columnCount = 9;
  if (windowWidth < 481) {
    columnCount = 3;
  } else if (windowWidth < 1024) {
    columnCount = 6;
  } else {
    columnCount = 9;
  }

  const rowCount = Math.ceil(sortedPokemons.length / columnCount);
  const columnWidth = windowWidth / columnCount; // Evenly distribute the width
  // Dynamic row height: Adjust multiplier as needed (1.5 here as an example)

    let heightMultiplier = 1.5; // Base multiplier
    if (windowWidth < 321) {
    heightMultiplier = 1.25; // Taller relative height for mobile
    } else if (windowWidth < 481) {
    heightMultiplier = 1.2;
    } else if (windowWidth < 768) {
    heightMultiplier = 1.5; // Medium screens
    } else if (windowWidth < 1024) {
    heightMultiplier = 1.65; // Tablets
    } else {
    heightMultiplier = 1.65; // Desktop
    }

    const rowHeight = Math.floor(columnWidth * heightMultiplier);

  // Cell renderer for each grid item
  const Cell = useCallback(({ columnIndex, rowIndex, style }) => {
    const index = rowIndex * columnCount + columnIndex;
    if (index >= sortedPokemons.length) return null;
    const pokemon = sortedPokemons[index];
    return (
      <div style={style}>
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
  }, [sortedPokemons, highlightedCards, handleSelect, isShiny, showShadow, multiFormPokedexNumbers, ownershipFilter, showAll, sortType, isEditable, toggleCardHighlight, setIsFastSelectEnabled, isFastSelectEnabled, variants, columnCount]);

  return (
    <FixedSizeGrid
      height={800}
      width={windowWidth}
      columnCount={columnCount}
      rowCount={rowCount}
      columnWidth={columnWidth}
      rowHeight={rowHeight}
      overscanRowCount={5}
      className="pokemon-grid" // CSS class to hide the scrollbar
    >
      {Cell}
    </FixedSizeGrid>
  );
}, (prevProps, nextProps) => {
  // Custom memo comparison function
  return prevProps.sortedPokemons === nextProps.sortedPokemons &&
    prevProps.highlightedCards === nextProps.highlightedCards &&
    prevProps.isShiny === nextProps.isShiny &&
    prevProps.showShadow === nextProps.showShadow &&
    prevProps.multiFormPokedexNumbers === nextProps.multiFormPokedexNumbers &&
    prevProps.ownershipFilter === nextProps.ownershipFilter &&
    prevProps.showAll === nextProps.showAll &&
    prevProps.sortType === nextProps.sortType &&
    prevProps.isEditable === nextProps.isEditable &&
    prevProps.isFastSelectEnabled === nextProps.isFastSelectEnabled &&
    prevProps.variants === nextProps.variants;
});

export default PokemonGrid;
