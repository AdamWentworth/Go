// useShowAllPokemons.js

import { useState, useEffect } from 'react';
import { getEvolutionaryFamily, shouldAddPokemon } from '../../../utils/searchFunctions';
import { formatCostumeName } from '../../../utils/formattingHelpers';

const useShowAllPokemons = (allPokemons, filters, showEvolutionaryLine) => {
  const [variants, setVariants] = useState([]);

  useEffect(() => {
    const generateVariants = (pokemon) => {
      let variants = [];

      // Default variant
      variants.push({ ...pokemon, currentImage: pokemon.image_url, variantType: 'default' });

      // Shiny variant
      if (pokemon.shiny_available) {
        variants.push({ ...pokemon, currentImage: pokemon.image_url_shiny, variantType: 'shiny', name: `Shiny ${pokemon.name}` });
      }

      // Shadow variant
      if (pokemon.date_shadow_available) {
        variants.push({ ...pokemon, currentImage: pokemon.image_url_shadow, variantType: 'shadow', name: `Shadow ${pokemon.name}` });

        // Shiny shadow variant
        if (pokemon.date_shiny_shadow_available) {
          variants.push({ ...pokemon, currentImage: pokemon.image_url_shiny_shadow, variantType: 'shiny_shadow', name: `Shiny Shadow ${pokemon.name}` });
        }
      }

      // Costumes (and their shiny variants if available)
      if (pokemon.costumes) {
        pokemon.costumes.forEach(costume => {
          // Costume variant
          const formattedCostumeName = formatCostumeName(costume.name);
          const costumeVariantName = `${formattedCostumeName} ${pokemon.name}`;
          variants.push({
            ...pokemon,
            currentImage: costume.image_url,
            variantType: `costume_${costume.costume_id}`,
            name: costumeVariantName
          });

          // Shiny costume variant
          if (costume.shiny_available) {
            const shinyCostumeVariantName = `Shiny ${formattedCostumeName} ${pokemon.name}`;
            variants.push({
              ...pokemon,
              currentImage: costume.image_url_shiny,
              variantType: `costume_${costume.costume_id}_shiny`,
              name: shinyCostumeVariantName
            });
          }
        });
      }

      return variants;
    };

    // First, generate variants for all pokemons
    let allVariants = allPokemons.flatMap(pokemon => generateVariants(pokemon));

    // If showing evolutionary line, filter to include family members based on the search term
    if (showEvolutionaryLine && filters.searchTerm) {
      const evolutionaryFamilyIds = getEvolutionaryFamily(filters.searchTerm, allPokemons);

      // Filter the original allPokemons first before generating variants
      const familyPokemons = allPokemons.filter(pokemon => evolutionaryFamilyIds.includes(pokemon.pokemon_id));
      allVariants = familyPokemons.flatMap(pokemon => generateVariants(pokemon));
    } else if (filters.searchTerm) { // Apply shouldAddPokemon filter only when not showing evolutionary line
      allVariants = allVariants.filter(variant =>
        shouldAddPokemon(variant, null, filters.selectedGeneration, filters.isShiny, filters.pokemonTypes, filters.searchTerm, filters.generations, filters.showShadow)
      );
    }

    setVariants(allVariants);

  }, [allPokemons, filters, showEvolutionaryLine]);

  console.log(`Final variants for '${filters.searchTerm}':`, variants);
  return variants;
};

export default useShowAllPokemons;
