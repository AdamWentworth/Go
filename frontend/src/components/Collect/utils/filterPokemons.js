// filterPokemons.js

import { getEvolutionaryFamily, shouldAddPokemon } from './filterHelpers';

export function filterPokemons(allPokemons, filters, showEvolutionaryLine, showAll) {
    if (!allPokemons.length) {
        console.log("No pokemons to filter, returning empty array.");
        return []; // Return early if no pokemons are available
    }
    
    const { selectedGeneration, isShiny, searchTerm, showCostume, showShadow, pokemonTypes, generations, singleFormPokedexNumbers } = filters;

    const evolutionaryFamily = showEvolutionaryLine ? getEvolutionaryFamily(searchTerm, allPokemons) : [];
    const addedSingleFormNumbers = new Set();

    const filteredPokemons = allPokemons.filter(pokemon => {
        // Ensure variantType is never undefined
        const variantType = pokemon.variantType || '';

        const isInEvolutionaryFamily = showEvolutionaryLine && evolutionaryFamily.includes(pokemon.pokemon_id);
        if (showEvolutionaryLine && !isInEvolutionaryFamily) {
            return false;
        }

        if (!showAll && singleFormPokedexNumbers.includes(pokemon.pokedex_number) && addedSingleFormNumbers.has(pokemon.pokedex_number)) {
            return false;
        }

        const matchesSearchTerm = shouldAddPokemon(pokemon, null, selectedGeneration, isShiny, pokemonTypes, searchTerm, generations, showShadow);
        if (!matchesSearchTerm && !isInEvolutionaryFamily) {
            return false;
        }

        if (!showAll && singleFormPokedexNumbers.includes(pokemon.pokedex_number)) {
            addedSingleFormNumbers.add(pokemon.pokedex_number);
        }

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

        return showAll;
    });

    console.log(`Displayed Pokemons: ${filteredPokemons.length}`);
    return filteredPokemons;
}

