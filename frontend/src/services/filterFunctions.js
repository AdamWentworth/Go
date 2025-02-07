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

export function getEvolutionaryFamilyFromPlusTokens(searchTerm, variants) {
    // 1. Split the searchTerm on commas
    const rawTokens = searchTerm.split(',').map(t => t.trim());
  
    // 2. Extract tokens that start with "+"
    //    and remove the "+" sign so we get just the name.
    const plusTokens = rawTokens
      .filter(token => token.startsWith('+'))
      .map(token => token.slice(1).toLowerCase());
  
    // 3. For those tokens, find the base Pokémon that match
    //    and build a union of all their evolutions/pre-evolutions.
    let family = new Set();
  
    function findAllEvolutions(pokemonId) {
      if (family.has(pokemonId)) return; // skip if already added
  
      const pokemon = variants.find(p => p.pokemon_id === pokemonId);
      if (!pokemon) return;
  
      family.add(pokemonId);
  
      // Add forward evolutions
      if (Array.isArray(pokemon.evolves_to)) {
        pokemon.evolves_to.forEach(evoId => findAllEvolutions(evoId));
      }
  
      // Add pre-evolutions
      if (Array.isArray(pokemon.evolves_from)) {
        pokemon.evolves_from.forEach(preId => findAllEvolutions(preId));
      }
    }
  
    // 4. Find all "base" Pokémon whose name matches any plusToken
    //    and gather full family for each.
    variants.forEach(p => {
      const pName = p.species_name.toLowerCase();
      if (plusTokens.some(t => pName.includes(t))) {
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