// useFilterPokemons.js

import { useMemo } from 'react';
import { getEvolutionaryFamily, shouldAddPokemon } from '../../utils/filterHelpers';

const useFilterPokemons = (allPokemons, filters, showEvolutionaryLine, showAll) => {
    const { selectedGeneration, isShiny, searchTerm, showCostume, showShadow, pokemonTypes, generations, singleFormPokedexNumbers } = filters;

    const displayedPokemons = useMemo(() => {
        const evolutionaryFamily = showEvolutionaryLine ? getEvolutionaryFamily(searchTerm, allPokemons) : [];
        const addedSingleFormNumbers = new Set(); // Used to track single form Pokédex numbers when showAll is false

        return allPokemons.filter(pokemon => {
            // Directly check for evolutionary family inclusion if applicable
            const isInEvolutionaryFamily = showEvolutionaryLine && evolutionaryFamily.includes(pokemon.pokemon_id);
            if (showEvolutionaryLine && !isInEvolutionaryFamily) {
                return false; // Skip this Pokémon if not in the evolutionary family
            }

            // When showAll is false, check if Pokémon's Pokédex number is already added; if showAll is true, this check is bypassed
            if (!showAll && singleFormPokedexNumbers.includes(pokemon.pokedex_number) && addedSingleFormNumbers.has(pokemon.pokedex_number)) {
                return false; // Skip this Pokémon
            }

            // Match against search term and other filter criteria
            const matchesSearchTerm = shouldAddPokemon(pokemon, null, selectedGeneration, isShiny, pokemonTypes, searchTerm, generations, showShadow);
            if (!matchesSearchTerm && !isInEvolutionaryFamily) return false; // Skip Pokémon if it doesn't match the search term criteria unless it's in the evolutionary family

            // If showAll is false, add Pokémon's Pokédex number to the set to ensure it's only included once
            if (!showAll && singleFormPokedexNumbers.includes(pokemon.pokedex_number)) {
                addedSingleFormNumbers.add(pokemon.pokedex_number);
            }

            // Existing variant filtering logic below
            // Check for inclusion in the evolutionary family, if applicable
            if (showEvolutionaryLine && !isInEvolutionaryFamily) return false;

            // Default filtering logic as an example when not showing all
            if (!isShiny && !showShadow && !showCostume && pokemon.variantType === 'default') {
                return true;
            }
            
            // Extract specific flags from variantType
            const isVariantShiny = pokemon.variantType.includes('shiny');
            const isVariantShadow = pokemon.variantType.includes('shadow');
            const isVariantCostume = pokemon.variantType.includes('costume');

            // Determine if the variant matches active filters
            if (isShiny && !showShadow && !showCostume) {
                // Show only non-costume shinies unless showCostume is also true
                return isVariantShiny && !isVariantCostume && !pokemon.variantType.includes('shiny_shadow');
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
                return isVariantCostume && !pokemon.variantType.includes('_shiny');
            }

            if (isShiny && showCostume) {
                // Show shiny costumes specifically
                return isVariantCostume && isVariantShiny;
            }

            // Fallback to true when showAll is active, otherwise continue with specific variant checks
            if (showAll) {
                return true; // Show all variants when showAll is active
            }

            // Fallback to false for all other cases
            return false;
        });
    }, [allPokemons, showEvolutionaryLine, showAll, isShiny, showShadow, showCostume, searchTerm, selectedGeneration, pokemonTypes, generations, singleFormPokedexNumbers]);

    console.log(`Displayed Pokemons: ${displayedPokemons.length}`);

    console.log('Displayed Pokemons', displayedPokemons)

    return displayedPokemons;
};

export default useFilterPokemons;