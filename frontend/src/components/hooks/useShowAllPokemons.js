// useShowAllPokemons.js

import { useState, useEffect } from 'react';

const useShowAllPokemons = (allPokemons) => {
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

    // Flatten the array of all variants for all Pokémon
    const allVariants = allPokemons.flatMap(pokemon => generateVariants(pokemon));
    console.log("All Variants:", allVariants); // Log all generated variants
    setVariants(allVariants);
  }, [allPokemons]); // This ensures generateVariants runs only when allPokemons changes.

  return variants;
};

export default useShowAllPokemons;

