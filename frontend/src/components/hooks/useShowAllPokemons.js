// useShowAllPokemons.js

import { useState, useEffect } from 'react';
import { shouldAddPokemon, getEvolutionaryFamily } from '../../utils/searchFunctions';

const useShowAllPokemons = (allPokemons, filters, showEvolutionaryLine) => {
  const [variants, setVariants] = useState([]);

  useEffect(() => {
    const generateVariants = (pokemon) => {
      let variants = [];

      // Default variant
      variants.push({ ...pokemon, currentImage: pokemon.image_url, variantType: 'default' });

      // Shiny variant
      if (pokemon.shiny_available) {
        variants.push({ ...pokemon, currentImage: pokemon.image_url_shiny, variantType: 'shiny' });
      }

      // Shadow variant
      if (pokemon.date_shadow_available) {
        variants.push({ ...pokemon, currentImage: pokemon.image_url_shadow, variantType: 'shadow' });

        // Shiny shadow variant
        if (pokemon.date_shiny_shadow_available) {
          variants.push({ ...pokemon, currentImage: pokemon.image_url_shiny_shadow, variantType: 'shiny_shadow' });
        }
      }

      // Costumes (and their shiny variants if available)
      if (pokemon.costumes) {
        pokemon.costumes.forEach(costume => {
          // Costume variant
          variants.push({ ...pokemon, currentImage: costume.image_url, variantType: `costume_${costume.costume_id}` });

          // Shiny costume variant
          if (costume.shiny_available) {
            variants.push({ ...pokemon, currentImage: costume.image_url_shiny, variantType: `costume_${costume.costume_id}_shiny` });
          }
        });
      }

      return variants;
    };

    // First, generate variants for all pokemons
    let allVariants = allPokemons.flatMap(pokemon => generateVariants(pokemon));

    // Filter variants by search term
    if (filters.searchTerm) {
      allVariants = allVariants.filter(variant =>
        variant.name.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }

    // If showing evolutionary line, filter to include family members based on the search term
    if (showEvolutionaryLine && filters.searchTerm) {
      const evolutionaryFamilyIds = getEvolutionaryFamily(filters.searchTerm, allPokemons);
      // console.log(`Evolutionary family IDs for '${filters.searchTerm}':`, evolutionaryFamilyIds);

      // Important: Filter the original allPokemons first before generating variants
      const familyPokemons = allPokemons.filter(pokemon => evolutionaryFamilyIds.includes(pokemon.pokemon_id));
      allVariants = familyPokemons.flatMap(pokemon => generateVariants(pokemon));
    }

    setVariants(allVariants);
  }, [allPokemons, filters.searchTerm, showEvolutionaryLine]);

  // console.log(`Final variants for '${filters.searchTerm}':`, variants);
  return variants;
};

export default useShowAllPokemons;
