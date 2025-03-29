// PokemonGrid.jsx
import React, { useState, useEffect, useRef, memo } from 'react';
import PokemonCard from './PokemonCard';
import './PokemonGrid.css';

const BATCH_SIZE = 50;

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
  variants }) => {
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const sentinelRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, sortedPokemons.length));
      }
    }, { threshold: 0 }); // Changed threshold to 0
  
    const currentSentinel = sentinelRef.current;
    if (currentSentinel) observer.observe(currentSentinel);
    return () => observer.disconnect();
  }, [sortedPokemons.length]);  

  const visiblePokemons = sortedPokemons.slice(0, visibleCount);

  return (
    <div className="pokemon-grid">
      {visiblePokemons.map((pokemon) => (
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
      <div ref={sentinelRef} style={{ height: '1px' }} />
    </div>
  );
});

export default PokemonGrid;