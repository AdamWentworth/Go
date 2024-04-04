// createPokemonVariants.js

import { formatCostumeName } from './formattingHelpers';

const createPokemonVariants = (pokemons) => {
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

  return pokemons.flatMap(pokemon => generateVariants(pokemon));
};

export default createPokemonVariants;
