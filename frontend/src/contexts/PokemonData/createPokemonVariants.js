// createPokemonVariants.js

import { formatCostumeName } from '../../utils/formattingHelpers';
import { determinePokemonKey } from '../../utils/PokemonIDUtils';
import { matchFormsAndVariantType } from '../../utils/formMatcher';

const createPokemonVariants = (pokemons) => {
  const generateVariants = (pokemon) => {
    let variants = [];

    const addVariant = (variant) => {
      variant.pokemonKey = determinePokemonKey(variant);
      variants.push(variant);
    };

    // 1. Default variant
    const defaultVariant = {
      ...pokemon,
      species_name: pokemon.name,  // Always the original Pokémon’s name
      currentImage: pokemon.image_url,
      variantType: 'default',
      name: pokemon.name
    };
    addVariant(defaultVariant);

    // 2. Shiny
    if (pokemon.shiny_available) {
      const shinyVariant = {
        ...pokemon,
        species_name: pokemon.name,
        currentImage: pokemon.image_url_shiny,
        variantType: 'shiny',
        name: `Shiny ${pokemon.name}`
      };
      addVariant(shinyVariant);
    }

    // 3. Shadow / Shiny Shadow
    if (pokemon.date_shadow_available) {
      const shadowVariant = {
        ...pokemon,
        species_name: pokemon.name,
        currentImage: pokemon.image_url_shadow,
        variantType: 'shadow',
        name: `Shadow ${pokemon.name}`
      };
      addVariant(shadowVariant);

      if (pokemon.date_shiny_shadow_available) {
        const shinyShadowVariant = {
          ...pokemon,
          species_name: pokemon.name,
          currentImage: pokemon.image_url_shiny_shadow,
          variantType: 'shiny_shadow',
          name: `Shiny Shadow ${pokemon.name}`
        };
        addVariant(shinyShadowVariant);
      }
    }

    // 4. Costumes
    if (pokemon.costumes) {
      pokemon.costumes.forEach((costume) => {
        const costumeVariant = {
          ...pokemon,
          species_name: pokemon.name,
          currentImage: costume.image_url,
          variantType: `costume_${costume.costume_id}`,
          name: `${formatCostumeName(costume.name)} ${pokemon.name}`
        };
        addVariant(costumeVariant);

        if (costume.shiny_available) {
          const shinyCostumeVariant = {
            ...pokemon,
            species_name: pokemon.name,
            currentImage: costume.image_url_shiny,
            variantType: `costume_${costume.costume_id}_shiny`,
            name: `Shiny ${formatCostumeName(costume.name)} ${pokemon.name}`
          };
          addVariant(shinyCostumeVariant);
        }

        if (costume.shadow_costume) {
          const shadowCostumeVariant = {
            ...pokemon,
            species_name: pokemon.name,
            currentImage: costume.shadow_costume.image_url_shadow_costume,
            variantType: `shadow_costume_${costume.costume_id}`,
            name: `Shadow ${formatCostumeName(costume.name)} ${pokemon.name}`
          };
          addVariant(shadowCostumeVariant);
        }
      });
    }

    // 5. Mega / Primal Variants
    if (pokemon.megaEvolutions && pokemon.megaEvolutions.length > 0) {
      pokemon.megaEvolutions.forEach((megaEvolution) => {
        const formSuffix = megaEvolution.form ? `_${megaEvolution.form.toLowerCase()}` : '';

        // Base Mega/Primal
        const baseVariant = {
          ...pokemon,
          species_name: pokemon.name,
          attack: megaEvolution.attack || pokemon.attack,
          defense: megaEvolution.defense || pokemon.defense,
          stamina: megaEvolution.stamina || pokemon.stamina,
          image_url: megaEvolution.image_url || pokemon.image_url,
          image_url_shiny: megaEvolution.image_url_shiny || pokemon.image_url_shiny,
          sprite_url: megaEvolution.sprite_url || pokemon.sprite_url,
          primal: megaEvolution.primal || pokemon.primal,
          form: megaEvolution.form || pokemon.form,
          type_1_id: megaEvolution.type_1_id,
          type_2_id: megaEvolution.type_2_id,
          type1_name: megaEvolution.type1_name,
          type2_name: megaEvolution.type2_name,
          type_1_icon: `/images/types/${megaEvolution.type1_name.toLowerCase()}.png`,
          type_2_icon: megaEvolution.type2_name
            ? `/images/types/${megaEvolution.type2_name.toLowerCase()}.png`
            : null,
          currentImage: megaEvolution.image_url,
          name: megaEvolution.primal
            ? `Primal ${pokemon.name}`
            : `Mega ${pokemon.name} ${megaEvolution.form ? megaEvolution.form : ''}`.trim(),
          variantType: megaEvolution.primal ? 'primal' : `mega${formSuffix}`,
          cp40: megaEvolution.cp40 || pokemon.cp40,
          cp50: megaEvolution.cp50 || pokemon.cp50
        };
        addVariant(baseVariant);

        // Shiny Mega/Primal
        if (megaEvolution.image_url_shiny && pokemon.shiny_available) {
          const shinyVariant = {
            ...baseVariant,
            species_name: pokemon.name, // same species_name
            currentImage: megaEvolution.image_url_shiny,
            name: megaEvolution.primal
              ? `Shiny Primal ${pokemon.name}`
              : `Shiny Mega ${pokemon.name} ${megaEvolution.form ? megaEvolution.form : ''}`.trim(),
            variantType: megaEvolution.primal ? 'shiny_primal' : `shiny_mega${formSuffix}`
          };
          addVariant(shinyVariant);
        }
      });
    }

    // 6. Fusion Variants
    if (pokemon.fusion && pokemon.fusion.length > 0) {
      pokemon.fusion.forEach((fusion) => {
        // Only create a fusion variant if this Pokémon is the *primary* base
        if (pokemon.pokemon_id !== fusion.base_pokemon_id1) {
          return;
        }

        // Normal Fusion
        const fusionVariant = {
          ...pokemon,
          species_name: pokemon.name,  // For consistency, always the base Pokémon’s name
          attack: fusion.attack || pokemon.attack,
          defense: fusion.defense || pokemon.defense,
          stamina: fusion.stamina || pokemon.stamina,
          type_1_id: fusion.type_1_id,
          type_2_id: fusion.type_2_id,
          type1_name: fusion.type1_name,
          type2_name: fusion.type2_name,
          type_1_icon: `/images/types/${fusion.type1_name.toLowerCase()}.png`,
          type_2_icon: fusion.type2_name
            ? `/images/types/${fusion.type2_name.toLowerCase()}.png`
            : null,
          image_url: fusion.image_url || pokemon.image_url,
          image_url_shiny: fusion.image_url_shiny || pokemon.image_url_shiny,
          sprite_url: fusion.sprite_url || pokemon.sprite_url,
          currentImage: fusion.image_url || pokemon.image_url,
          name: fusion.name, // The displayed name is the fusion name
          variantType: `fusion_${fusion.fusion_id}`,
          cp40: fusion.cp40 || pokemon.cp40,
          cp50: fusion.cp50 || pokemon.cp50
        };
        addVariant(fusionVariant);

        // Shiny Fusion
        if (fusion.image_url_shiny) {
          const shinyFusionVariant = {
            ...pokemon,
            species_name: pokemon.name, // same base species_name
            attack: fusion.attack || pokemon.attack,
            defense: fusion.defense || pokemon.defense,
            stamina: fusion.stamina || pokemon.stamina,
            type_1_id: fusion.type_1_id,
            type_2_id: fusion.type_2_id,
            type1_name: fusion.type1_name,
            type2_name: fusion.type2_name,
            type_1_icon: `/images/types/${fusion.type1_name.toLowerCase()}.png`,
            type_2_icon: fusion.type2_name
              ? `/images/types/${fusion.type2_name.toLowerCase()}.png`
              : null,
            image_url: fusion.image_url,
            image_url_shiny: fusion.image_url_shiny,
            sprite_url: fusion.sprite_url,
            currentImage: fusion.image_url_shiny,
            name: `Shiny ${fusion.name}`,
            variantType: `shiny_fusion_${fusion.fusion_id}`,
            cp40: fusion.cp40 || pokemon.cp40,
            cp50: fusion.cp50 || pokemon.cp50
          };
          addVariant(shinyFusionVariant);
        }
      });
    }

    // 7. Dynamax variants
    if (pokemon.max && pokemon.max.length > 0) {
      pokemon.max.forEach((maxEntry) => {
        if (maxEntry.dynamax) {
          // Dynamax
          const dynamaxVariant = {
            ...pokemon,
            species_name: pokemon.name,
            currentImage: pokemon.image_url,
            name: `Dynamax ${pokemon.name}`,
            variantType: 'dynamax'
          };
          addVariant(dynamaxVariant);

          // Shiny Dynamax
          if (pokemon.shiny_available) {
            const shinyDynamaxVariant = {
              ...pokemon,
              species_name: pokemon.name,
              currentImage: pokemon.image_url_shiny,
              name: `Shiny Dynamax ${pokemon.name}`,
              variantType: 'shiny_dynamax'
            };
            addVariant(shinyDynamaxVariant);
          }
        }
      });
    }

    // 8. Gigantamax variants
    if (pokemon.max && pokemon.max.length > 0) {
      pokemon.max.forEach((maxEntry) => {
        if (maxEntry.gigantamax) {
          // Gigantamax
          const gigantamaxVariant = {
            ...pokemon,
            species_name: pokemon.name,
            currentImage: maxEntry.gigantamax_image_url,
            name: `Gigantamax ${pokemon.name}`,
            variantType: 'gigantamax'
          };
          addVariant(gigantamaxVariant);

          // Shiny Gigantamax
          if (maxEntry.shiny_gigantamax_image_url) {
            const shinyGigantamaxVariant = {
              ...pokemon,
              species_name: pokemon.name,
              currentImage: maxEntry.shiny_gigantamax_image_url,
              name: `Shiny Gigantamax ${pokemon.name}`,
              variantType: 'shiny_gigantamax'
            };
            addVariant(shinyGigantamaxVariant);
          }
        }
      });
    }

    // 9. Strip raid_boss data from variants that don't match
    variants = variants.map((variant) => {
      const raidBossForms = pokemon.raid_boss.map((rb) => rb.form);
      const matchResult = raidBossForms.some((raidBossForm) =>
        matchFormsAndVariantType(
          variant,
          variant.form,
          raidBossForm,
          variant.variantType,
          pokemon.pokemon_id
        )
      );

      if (!matchResult) {
        const { raid_boss, ...rest } = variant;
        return rest;
      }
      return variant;
    });

    return variants;
  };

  return pokemons.flatMap(generateVariants);
};

export default createPokemonVariants;
