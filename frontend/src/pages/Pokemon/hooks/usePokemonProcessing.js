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
  sortType,
  sortMode
) {
  // Apply ownership-based filtering if needed
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

  // Filter the Pokémon list (no more showAll parameter)
  const displayedPokemons = useFilterPokemons(
    filteredVariants,
    variants,
    filters,
    showEvolutionaryLine
  );

  // Sort the results (removed showAll from options)
  const sortedPokemons = useSortManager(displayedPokemons, sortType, sortMode, {
    isShiny: filters.isShiny,
    showShadow: filters.showShadow,
    showCostume: filters.showCostume,
  });

  return { filteredVariants, sortedPokemons };
}

export default usePokemonProcessing;
