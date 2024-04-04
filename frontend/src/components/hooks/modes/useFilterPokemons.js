// useFilterPokemons.js

import { useMemo } from 'react';
import { getEvolutionaryFamily } from '../../../utils/searchFunctions';

const useFilterPokemons = (allPokemons, filters, showEvolutionaryLine, showAll) => {
    const { selectedGeneration, isShiny, searchTerm, showCostume, showShadow } = filters;

    const displayedPokemons = useMemo(() => {
        return allPokemons.filter(pokemon => {
            // Check for inclusion in the evolutionary family, if applicable.
            const isInEvolutionaryFamily = showEvolutionaryLine && getEvolutionaryFamily(searchTerm, allPokemons).includes(pokemon.pokemon_id);
            if (showEvolutionaryLine && !isInEvolutionaryFamily) return false;

            // Default filtering logic
            if (!showAll && !isShiny && !showShadow && !showCostume && pokemon.variantType === 'default') return true;
            
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

            if (showAll) {
                // Show all variants when showAll is active
                return true;
            }

            // Fallback to false for all other cases
            return false;
        });
    }, [allPokemons, showEvolutionaryLine, showAll, isShiny, showShadow, showCostume, searchTerm, selectedGeneration]);

    console.log(`Displayed Pokemons: ${displayedPokemons.length}`);

    return displayedPokemons;
};

export default useFilterPokemons;
