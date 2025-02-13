// usePokemonProcessing.js

import { useMemo } from 'react';
import useFilterPokemons from '../../../hooks/filtering/useFilterPokemons';
import useSortManager from '../../../hooks/sort/useSortManager';
import { getFilteredPokemonsByOwnership } from '../../../hooks/filtering/usePokemonOwnershipFilter';

function usePokemonProcessing(
  variants,
  ownershipData,
  ownershipFilter,
  activeLists,
  filters,
  showEvolutionaryLine,
  showAll,
  sortType,
  sortMode
) {
  // Filtering logic
  const filteredVariants = useMemo(() => {
    if (ownershipFilter) {
      return getFilteredPokemonsByOwnership(
        variants,
        ownershipData,
        ownershipFilter,
        activeLists
      );
    }
    return variants;
  }, [variants, ownershipData, ownershipFilter, activeLists]);

  // Additional filtering based on other criteria
  const displayedPokemons = useFilterPokemons(
    filteredVariants,
    variants, // Passing variants along with filteredVariants
    filters,
    showEvolutionaryLine,
    showAll
  );

  // Sorting logic
  const sortedPokemons = useSortManager(displayedPokemons, sortType, sortMode, {
    isShiny: filters.isShiny,
    showShadow: filters.showShadow,
    showCostume: filters.showCostume,
    showAll,
  });

  return { filteredVariants, sortedPokemons };
}

export default usePokemonProcessing;
