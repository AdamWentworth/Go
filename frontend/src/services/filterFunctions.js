//filterFunctions.js

import { matchesSearchTerm } from './searchFunctions';

export function getEvolutionaryFamily(searchTerm, variants) {
    // Split on commas, trim spaces, and lowercase each term
    const terms = searchTerm.split(',')
    .map(t => t.trim().toLowerCase());

    // Find all pokemons that match *any* of the comma-separated terms
    const basePokemons = variants.filter(p => 
    terms.some(term => p.species_name.toLowerCase().includes(term))
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

export function getEvolutionaryFamilyFromPlusTokens(searchTerm, variants, pokemonTypes, generations) {
  // Split the search term on both commas and ampersands,
  // then filter out any empty tokens.
  const tokens = searchTerm
    .split(/[,&]/)
    .map(t => t.trim())
    .filter(t => t.length > 0);
  
  // Extract tokens that start with "+"
  const plusTokens = tokens
    .filter(token => token.startsWith('+'))
    .map(token => token.slice(1).toLowerCase());
  
  // Extract the other tokens (non-plus tokens)
  const normalTokens = tokens.filter(token => !token.startsWith('+'));
  
  // Rebuild a “normal search” string from the non-plus tokens.
  // (This string will be passed to matchesSearchTerm so that it enforces generation, type, etc.)
  const normalSearchTerm = normalTokens.join('&');
  
  let family = new Set();
  
  function findAllEvolutions(pokemonId) {
    if (family.has(pokemonId)) return; // already processed
  
    const pokemon = variants.find(p => p.pokemon_id === pokemonId);
    if (!pokemon) return;
  
    // Add this Pokémon (it’s part of the chain)
    family.add(pokemonId);
  
    // Recursively add its evolutions...
    if (Array.isArray(pokemon.evolves_to)) {
      pokemon.evolves_to.forEach(evoId => findAllEvolutions(evoId));
    }
  
    // ...and pre-evolutions.
    if (Array.isArray(pokemon.evolves_from)) {
      pokemon.evolves_from.forEach(preId => findAllEvolutions(preId));
    }
  }
  
  // For each Pokémon in the variants list, if:
  // 1. Its species name contains one of the plus tokens, AND
  // 2. It passes the “normal” search filter (built from non-plus tokens)
  // then we “seed” its evolutionary chain.
  variants.forEach(p => {
    const pName = p.species_name.toLowerCase();
    if (
      plusTokens.some(pt => pName.includes(pt)) &&
      // Use your existing matchesSearchTerm to require that p matches the normal search
      matchesSearchTerm(p, normalSearchTerm, pokemonTypes, generations)
    ) {
      findAllEvolutions(p.pokemon_id);
    }
  });
  
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