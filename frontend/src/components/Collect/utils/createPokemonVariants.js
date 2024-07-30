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
        if (costume.shadow_costume) {
          const shadowCostumeVariant = {
            ...pokemon,
            currentImage: costume.shadow_costume.image_url_shadow_costume,
            variantType: `shadow_costume_${costume.costume_id}`,
            name: `Shadow ${formatCostumeName(costume.name)} ${pokemon.name}`
          };
          shadowCostumeVariant.pokemonKey = determinePokemonKey(shadowCostumeVariant);
          variants.push(shadowCostumeVariant);
        }
      });
    }

    // Check if there are Mega Evolutions and merge them into the base Pokemon data
    if (pokemon.megaEvolutions && pokemon.megaEvolutions.length > 0) {
      pokemon.megaEvolutions.forEach(megaEvolution => {

        const formSuffix = megaEvolution.form ? `_${megaEvolution.form.toLowerCase()}` : '';
        
        const baseVariant = {
          ...pokemon,
          attack: megaEvolution.attack || pokemon.attack,
          defense: megaEvolution.defense || pokemon.defense,
          stamina: megaEvolution.stamina || pokemon.stamina,
          image_url: megaEvolution.image_url || pokemon.image_url,
          image_url_shiny: megaEvolution.image_url_shiny || pokemon.image_url_shiny,
          sprite_url: megaEvolution.sprite_url || pokemon.sprite_url,
          primal: megaEvolution.primal || pokemon.primal,
          form: megaEvolution.form || pokemon.form,
          type_1_id: megaEvolution.type_1_id || pokemon.type_1_id,
          type_2_id: megaEvolution.type_2_id || pokemon.type_2_id,
          type1_name: megaEvolution.type1_name || pokemon.type1_name,
          type2_name: megaEvolution.type2_name || pokemon.type2_name,
          type_1_icon: `/images/types/${megaEvolution.type1_name.toLowerCase()}.png`,
          type_2_icon: megaEvolution.type2_name ? `/images/types/${megaEvolution.type2_name.toLowerCase()}.png` : null,
          currentImage: megaEvolution.image_url,
          name: megaEvolution.primal ? `Primal ${pokemon.name}` : `Mega ${pokemon.name} ${megaEvolution.form ? megaEvolution.form : ''}`.trim(),
          variantType: megaEvolution.primal ? `primal` : `mega${formSuffix}`
        };

        baseVariant.pokemonKey = determinePokemonKey(baseVariant);
        variants.push(baseVariant);

        if (megaEvolution.image_url_shiny) {
          const shinyVariant = {
            ...baseVariant,
            currentImage: megaEvolution.image_url_shiny,
            name: megaEvolution.primal ? `Shiny Primal ${pokemon.name}` : `Shiny Mega ${pokemon.name} ${megaEvolution.form ? megaEvolution.form : ''}`.trim(),
            variantType: megaEvolution.primal ? `shiny_primal` : `shiny_mega${formSuffix}`
          };
          shinyVariant.pokemonKey = determinePokemonKey(shinyVariant);
          variants.push(shinyVariant);
        }
      });
    }

    return variants;
  };

  return pokemons.flatMap(generateVariants);
};

export default createPokemonVariants;

