// createPokemonVariants.js

import { formatCostumeName } from './formattingHelpers';
import { determinePokemonKey } from './imageHelpers'; // Make sure the path is correct

const createPokemonVariants = (pokemons) => {
  const generateVariants = (pokemon) => {
    let variants = [];

    // Generate each type of variant
    const defaultVariant = {
      ...pokemon,
      currentImage: pokemon.image_url,
      variantType: 'default'
    };
    defaultVariant.pokemonKey = determinePokemonKey(defaultVariant);
    variants.push(defaultVariant);

    if (pokemon.shiny_available) {
      const shinyVariant = {
        ...pokemon,
        currentImage: pokemon.image_url_shiny,
        variantType: 'shiny',
        name: `Shiny ${pokemon.name}`
      };
      shinyVariant.pokemonKey = determinePokemonKey(shinyVariant);
      variants.push(shinyVariant);
    }

    if (pokemon.date_shadow_available) {
      const shadowVariant = {
        ...pokemon,
        currentImage: pokemon.image_url_shadow,
        variantType: 'shadow',
        name: `Shadow ${pokemon.name}`
      };
      shadowVariant.pokemonKey = determinePokemonKey(shadowVariant);
      variants.push(shadowVariant);

      if (pokemon.date_shiny_shadow_available) {
        const shinyShadowVariant = {
          ...pokemon,
          currentImage: pokemon.image_url_shiny_shadow,
          variantType: 'shiny_shadow',
          name: `Shiny Shadow ${pokemon.name}`
        };
        shinyShadowVariant.pokemonKey = determinePokemonKey(shinyShadowVariant);
        variants.push(shinyShadowVariant);
      }
    }

    if (pokemon.costumes) {
      pokemon.costumes.forEach(costume => {
        const costumeVariant = {
          ...pokemon,
          currentImage: costume.image_url,
          variantType: `costume_${costume.costume_id}`,
          name: `${formatCostumeName(costume.name)} ${pokemon.name}`
        };
        costumeVariant.pokemonKey = determinePokemonKey(costumeVariant);
        variants.push(costumeVariant);

        if (costume.shiny_available) {
          const shinyCostumeVariant = {
            ...pokemon,
            currentImage: costume.image_url_shiny,
            variantType: `costume_${costume.costume_id}_shiny`,
            name: `Shiny ${formatCostumeName(costume.name)} ${pokemon.name}`
          };
          shinyCostumeVariant.pokemonKey = determinePokemonKey(shinyCostumeVariant);
          variants.push(shinyCostumeVariant);
        }
      });
    }

    return variants;
  };

  return pokemons.flatMap(generateVariants);
};

export default createPokemonVariants;

