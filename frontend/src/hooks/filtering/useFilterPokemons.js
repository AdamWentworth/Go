// useFilterPokemons.js

import { useMemo } from 'react';
import {
  getEvolutionaryFamily,
  getEvolutionaryFamilyFromPlusTokens,
  shouldAddPokemon,
} from '../../services/filterFunctions';

const useFilterPokemons = (
  filteredVariants,
  variants,
  filters,
  showEvolutionaryLine
) => {
  const {
    selectedGeneration,
    searchTerm,
    pokemonTypes,
    generations,
    // multiFormPokedexNumbers removed since we’re not filtering duplicates anymore
  } = filters;

  const displayedPokemons = useMemo(() => {
    // 1) If evolutionary filtering is active, get the family IDs
    const normalFamily = showEvolutionaryLine
      ? getEvolutionaryFamily(searchTerm, variants)
      : [];
    const plusFamily = getEvolutionaryFamilyFromPlusTokens(
      searchTerm,
      variants,
      pokemonTypes,
      generations
    );
    const combinedFamilyIds = new Set([...normalFamily, ...plusFamily]);

    // 2) Filter pokemons based on evolutionary line and normal search
    return filteredVariants.filter((pokemon) => {
      const isInCombinedFamily = combinedFamilyIds.has(pokemon.pokemon_id);

      // When "Show Evolutionary Line" is active, require the Pokémon to be in the family
      if (showEvolutionaryLine && !isInCombinedFamily) {
        return false;
      }

      // Check the basic search/filters (variant details no longer matter)
      const passesNormalSearch = shouldAddPokemon(
        pokemon,
        null,
        selectedGeneration,
        null, // was isShiny
        pokemonTypes,
        searchTerm,
        generations,
        null, // was showShadow
        null  // was showCostume
      );

      if (!isInCombinedFamily && !passesNormalSearch) {
        return false;
      }

      return true;
    });
  }, [
    filteredVariants,
    showEvolutionaryLine,
    selectedGeneration,
    searchTerm,
    pokemonTypes,
    generations,
    variants,
  ]);

  return displayedPokemons;
};

export default useFilterPokemons;
