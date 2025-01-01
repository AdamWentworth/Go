// useUIHandlers.js

import { useCallback } from 'react';

function useUIHandlers({
  setOwnershipFilter,
  setIsShiny,
  setShowCostume,
  setShowShadow,
  setIsFastSelectEnabled,
  setHighlightedCards,
  setShowAll,
  highlightedCards,
  sortedPokemons
}) {
  
  const toggleShowAll = useCallback(() => setShowAll((prev) => !prev), [setShowAll]);
  
  const toggleShiny = useCallback(() => setIsShiny((prev) => !prev), [setIsShiny]);
  
  const toggleCostume = useCallback(() => setShowCostume((prev) => !prev), [setShowCostume]);
  
  const toggleShadow = useCallback(() => setShowShadow((prev) => !prev), [setShowShadow]);
  
  const handleFastSelectToggle = useCallback(
    (enabled) => setIsFastSelectEnabled(enabled),
    [setIsFastSelectEnabled]
  );
  
  const toggleCardHighlight = useCallback(
    (pokemonId) => {
      setHighlightedCards((prev) => {
        const newHighlights = new Set(prev);
        newHighlights.has(pokemonId)
        ? newHighlights.delete(pokemonId)
        : newHighlights.add(pokemonId);
        return newHighlights;
      });
    },
    [setHighlightedCards]
  );
  
  const selectAllToggle = useCallback(() => {
    if (highlightedCards.size === sortedPokemons.length) {
      setHighlightedCards(new Set());
    } else {
      setHighlightedCards(new Set(sortedPokemons.map((pokemon) => pokemon.pokemonKey)));
    }
  }, [highlightedCards, sortedPokemons, setHighlightedCards]);
  
  const handleUpdateOwnershipFilter = useCallback(
    (filterType) => {
      setOwnershipFilter((prev) => (prev === filterType ? '' : filterType));
    },
    [setOwnershipFilter]
  );
  return {
    handleUpdateOwnershipFilter,
    toggleShiny,
    toggleCostume,
    toggleShadow,
    handleFastSelectToggle,
    toggleCardHighlight,
    selectAllToggle,
    toggleShowAll
  };
}

export default useUIHandlers;
