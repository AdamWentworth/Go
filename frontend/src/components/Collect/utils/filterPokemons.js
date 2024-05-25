import { getEvolutionaryFamily, shouldAddPokemon } from '../utils/filterHelpers';

export function filterPokemons(allPokemons, filters, showEvolutionaryLine, showAll, singleFormPokedexNumbers) {
    if (!allPokemons.length) return []; // Return early if no pokemons are available

    // Deconstruct filters while ensuring that `searchTerm` is a string to avoid runtime errors.
    const {
        selectedGeneration,
        isShiny,
        searchTerm,
        showCostume,
        showShadow,
        pokemonTypes,
        generations
    } = filters;

    console.log("Filtering Pokemons:", { filters, showEvolutionaryLine, showAll });

    const evolutionaryFamily = showEvolutionaryLine ? getEvolutionaryFamily(searchTerm, allPokemons) : [];
    const addedSingleFormNumbers = new Set();

    return allPokemons.filter(pokemon => {
        const isInEvolutionaryFamily = showEvolutionaryLine && evolutionaryFamily.includes(pokemon.pokemon_id);
        if (showEvolutionaryLine && !isInEvolutionaryFamily) return false;

        if (!showAll && singleFormPokedexNumbers.includes(pokemon.pokedex_number) && addedSingleFormNumbers.has(pokemon.pokedex_number)) {
            return false;
        }

        const matchesSearchTerm = shouldAddPokemon(pokemon, selectedGeneration, isShiny, pokemonTypes, searchTerm, generations, showShadow);
        if (!matchesSearchTerm && !isInEvolutionaryFamily) return false;

        if (!showAll && singleFormPokedexNumbers.includes(pokemon.pokedex_number)) {
            addedSingleFormNumbers.add(pokemon.pokedex_number);
        }

        // Variant filtering logic
        const isVariantShiny = pokemon.variantType.includes('shiny');
        const isVariantShadow = pokemon.variantType.includes('shadow');
        const isVariantCostume = pokemon.variantType.includes('costume');

        if (isShiny && !showShadow && !showCostume) {
            return isVariantShiny && !isVariantCostume;
        }
        if (showShadow && !isShiny) {
            return isVariantShadow && !isVariantShiny;
        }
        if (isShiny && showShadow) {
            return pokemon.variantType === 'shiny_shadow';
        }
        if (showCostume && !isShiny) {
            return isVariantCostume && !isVariantShiny;
        }
        if (isShiny && showCostume) {
            return isVariantCostume && isVariantShiny;
        }

        return showAll; // When showAll is true, show all variants
    });
}
