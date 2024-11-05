// useUIHandlers.js

import { useCallback } from 'react';
import { confirmMoveToFilter } from '../PokemonOwnership/pokemonOwnershipManager'; // Adjust the import path accordingly

function useUIHandlers({
  setOwnershipFilter,
  setIsShiny,
  setShowCostume,
  setShowShadow,
  setIsFastSelectEnabled,
  setHighlightedCards,
  setShowAll,
  highlightedCards,
  sortedPokemons,
  updateOwnership,
  variants,
  ownershipData,
}) {
  const handleUpdateOwnershipFilter = useCallback(
    (filterType) => {
      setOwnershipFilter((prev) => (prev === filterType ? '' : filterType));
    },
    [setOwnershipFilter]
  );

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

  const handleMoveHighlightedToFilter = useCallback(
    (filter) => {
      updateOwnership([...highlightedCards], filter);
      setHighlightedCards(new Set());
      setOwnershipFilter(filter);
    },
    [highlightedCards, updateOwnership, setHighlightedCards, setOwnershipFilter]
  );

  const toggleShowAll = useCallback(() => setShowAll((prev) => !prev), [setShowAll]);

  // Add handleConfirmMoveToFilter
  const handleConfirmMoveToFilter = useCallback(
    (filter) => {
      confirmMoveToFilter(
        () => handleMoveHighlightedToFilter(filter),
        filter,
        highlightedCards,
        variants,
        ownershipData
      );
    },
    [handleMoveHighlightedToFilter, highlightedCards, variants, ownershipData]
  );

  return {
    handleUpdateOwnershipFilter,
    toggleShiny,
    toggleCostume,
    toggleShadow,
    handleFastSelectToggle,
    toggleCardHighlight,
    selectAllToggle,
    handleMoveHighlightedToFilter,
    toggleShowAll,
    handleConfirmMoveToFilter,
  };
}

export default useUIHandlers;
