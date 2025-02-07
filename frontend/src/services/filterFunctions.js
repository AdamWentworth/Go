//filterFunctions.js

import { matchesSearchTerm } from './searchFunctions';

export function getEvolutionaryFamily(searchTerm, variants) {
    // Split on commas, trim spaces, and lowercase each term
    const terms = searchTerm.split(',')
    .map(t => t.trim().toLowerCase());

    // Find all pokemons that match *any* of the comma-separated terms
    const basePokemons = variants.filter(p => 
    terms.some(term => p.name.toLowerCase().includes(term))
    );
    let family = new Set();

    const findAllEvolutions = (pokemonId) => {
        if (family.has(pokemonId)) {
            return; // Skip if already processed
        }

        const pokemon = variants.find(p => p.pokemon_id === pokemonId);
        if (!pokemon) return;

        // Add current pokemon to the family
        family.add(pokemon.pokemon_id);

        // Find evolutions
        if (Array.isArray(pokemon.evolves_to)) {
            pokemon.evolves_to.forEach(evolutionId => {
                findAllEvolutions(evolutionId);
            });
        }

        // Find pre-evolutions
        if (Array.isArray(pokemon.evolves_from)) {
            pokemon.evolves_from.forEach(preEvolutionId => {
                findAllEvolutions(preEvolutionId);
            });
        }
    };

    basePokemons.forEach(basePokemon => findAllEvolutions(basePokemon.pokemon_id));

    return Array.from(family);
}


export function shouldAddPokemon(pokemon, costume, selectedGeneration, isShiny, pokemonTypes, searchTerm, generations, showShadow, showCostume) {
    const matchesGeneration = selectedGeneration ? pokemon.generation === selectedGeneration : true;
    const matchesShiny = isShiny && showShadow ? pokemon.shiny_available === 1 && pokemon.shadow_shiny_available === 1 : (isShiny ? pokemon.shiny_available === 1 : true);
    const matchesCostume = showCostume ? pokemon.variantType.includes('costume') : true;

    const matchesSearch = matchesSearchTerm(pokemon, searchTerm, pokemonTypes, generations);

    const basicMatches = matchesGeneration && matchesShiny && matchesSearch && matchesCostume;

    if (costume) {
        return (
            !isShiny && !showShadow ||
            (isShiny && !showShadow && costume.shiny_available === 1) ||
            (!isShiny && showShadow && costume.shadow_available === 1) ||
            (isShiny && showShadow && costume.shiny_available === 1 && costume.shiny_shadow_available === 1)
        ) && basicMatches;
    } else {
        return basicMatches;
    }
}