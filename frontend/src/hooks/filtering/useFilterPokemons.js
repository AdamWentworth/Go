// useFilterPokemons.js

import { useMemo } from 'react';
import {
  // Original function for global "Show Evolutionary Line"
  getEvolutionaryFamily,
  // New helper for "+Name" logic (defined in filterFunctions.js, see below)
  getEvolutionaryFamilyFromPlusTokens,
  shouldAddPokemon,
} from '../../services/filterFunctions';

const useFilterPokemons = (
  filteredVariants,
  variants,
  filters,
  showEvolutionaryLine,
  showAll
) => {
  const {
    selectedGeneration,
    isShiny,
    searchTerm,
    showCostume,
    showShadow,
    pokemonTypes,
    generations,
    multiFormPokedexNumbers,
  } = filters;

  const displayedPokemons = useMemo(() => {
    // 1) If user toggles "Show Evolutionary Line," get entire families
    const normalFamily = showEvolutionaryLine
      ? getEvolutionaryFamily(searchTerm, variants)
      : [];

    // 2) Also get families from "+someName" tokens, regardless of showEvolutionaryLine
    const plusFamily = getEvolutionaryFamilyFromPlusTokens(searchTerm, variants, pokemonTypes, generations);

    // 3) Combine them so anything that is in either family is allowed
    const combinedFamilyIds = new Set([...normalFamily, ...plusFamily]);

    // Used to track single-form Pokédex numbers (your existing logic)
    const addedSingleFormNumbers = new Set();

    return filteredVariants.filter((pokemon) => {
      // Is this Pokémon in either the normal or the +Name family?
      const isInCombinedFamily = combinedFamilyIds.has(pokemon.pokemon_id);

      // If "Show Evolutionary Line" is on, the Pokémon must be in that family
      if (showEvolutionaryLine && !isInCombinedFamily) {
        return false;
      }

      // Single-form logic (skip duplicates if showAll is false)
      if (
        !showAll &&
        multiFormPokedexNumbers.includes(pokemon.pokedex_number) &&
        addedSingleFormNumbers.has(pokemon.pokedex_number)
      ) {
        return false;
      }

      // Check normal search/filters, *unless* we already have the Pokémon in a +Name family
      const passesNormalSearch = shouldAddPokemon(
        pokemon,
        null,
        selectedGeneration,
        isShiny,
        pokemonTypes,
        searchTerm,
        generations,
        showShadow,
        showCostume
      );

      // If it's neither in a family nor passes normal search, skip it
      if (!isInCombinedFamily && !passesNormalSearch) {
        return false;
      }

      // Mark single-form usage if needed
      if (
        !showAll &&
        multiFormPokedexNumbers.includes(pokemon.pokedex_number)
      ) {
        addedSingleFormNumbers.add(pokemon.pokedex_number);
      }

      // ----------------------------------------------------
      // Your existing variant filtering logic below.
      // ----------------------------------------------------

      // If no special flags are active, allow default forms
      if (!isShiny && !showShadow && !showCostume && pokemon.variantType === 'default') {
        return true;
      }

      const isVariantShiny = pokemon.variantType.includes('shiny');
      const isVariantShadow = pokemon.variantType.includes('shadow');
      const isVariantCostume = pokemon.variantType.includes('costume');

      // ShowAll combos
      if (isShiny && showAll && !showCostume) {
        return isVariantShiny;
      }
      if (showCostume && showAll && !showShadow) {
        return isVariantCostume;
      }
      if (showShadow && showAll && !showCostume) {
        return isVariantShadow;
      }
      if (showAll && isShiny && showCostume && !showShadow) {
        return isVariantCostume && isVariantShiny && !isVariantShadow;
      }
      if (showAll && isShiny && !showCostume && showShadow) {
        return !isVariantCostume && isVariantShiny && isVariantShadow;
      }
      if (showAll && !isShiny && showCostume && showShadow) {
        return isVariantCostume && !isVariantShiny && isVariantShadow;
      }
      if (showAll && isShiny && showCostume && showShadow) {
        return isVariantCostume && isVariantShiny && isVariantShadow;
      }

      // More specific filters
      if (isShiny && !showShadow && !showCostume) {
        // Show only non-costume shinies unless showCostume is also true
        return (
          isVariantShiny &&
          !isVariantCostume &&
          !pokemon.variantType.includes('shiny_shadow')
        );
      }

      if (showShadow && !isShiny) {
        // Show only shadows, excluding shiny shadows unless isShiny is also true
        return isVariantShadow && !isVariantShiny;
      }

      if (isShiny && showShadow) {
        // Show shiny shadows specifically
        return pokemon.variantType === 'shiny_shadow';
      }

      if (showCostume && !isShiny) {
        // Show only costumes, excluding shiny variants unless isShiny is also true
        return (
          isVariantCostume &&
          !pokemon.variantType.includes('_shiny') &&
          !pokemon.variantType.includes('_shadow')
        );
      }

      if (isShiny && showCostume) {
        // Show shiny costumes specifically
        return isVariantCostume && isVariantShiny;
      }

      // Fallback to showing everything if showAll is active
      if (showAll) {
        return true;
      }

      // Otherwise skip
      return false;
    });
  }, [
    filteredVariants,
    showEvolutionaryLine,
    showAll,
    isShiny,
    showShadow,
    showCostume,
    searchTerm,
    selectedGeneration,
    pokemonTypes,
    generations,
    multiFormPokedexNumbers,
    variants,
  ]);

  return displayedPokemons;
};

export default useFilterPokemons;
