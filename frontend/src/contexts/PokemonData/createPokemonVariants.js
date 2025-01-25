// createPokemonVariants.js
import { formatCostumeName } from '../../utils/formattingHelpers';
import { determinePokemonKey } from '../../utils/PokemonIDUtils';
import { matchFormsAndVariantType } from '../../utils/formMatcher';

const createPokemonVariants = (pokemons) => {
  const generateVariants = (pokemon) => {
    let variants = [];

    const addVariant = (variant, type) => {
      variant.pokemonKey = determinePokemonKey(variant);
      variant.variantType = type;
      variants.push(variant);
    };

    const defaultVariant = {
      ...pokemon,
      currentImage: pokemon.image_url,
      variantType: 'default'
    };
    addVariant(defaultVariant, 'default');

    if (pokemon.shiny_available) {
      const shinyVariant = {
        ...pokemon,
        currentImage: pokemon.image_url_shiny,
        variantType: 'shiny',
        name: `Shiny ${pokemon.name}`
      };
      addVariant(shinyVariant, 'shiny');
    }

    if (pokemon.date_shadow_available) {
      const shadowVariant = {
        ...pokemon,
        currentImage: pokemon.image_url_shadow,
        variantType: 'shadow',
        name: `Shadow ${pokemon.name}`
      };
      addVariant(shadowVariant, 'shadow');

      if (pokemon.date_shiny_shadow_available) {
        const shinyShadowVariant = {
          ...pokemon,
          currentImage: pokemon.image_url_shiny_shadow,
          variantType: 'shiny_shadow',
          name: `Shiny Shadow ${pokemon.name}`
        };
        addVariant(shinyShadowVariant, 'shiny_shadow');
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
        addVariant(costumeVariant, `costume_${costume.costume_id}`);

        if (costume.shiny_available) {
          const shinyCostumeVariant = {
            ...pokemon,
            currentImage: costume.image_url_shiny,
            variantType: `costume_${costume.costume_id}_shiny`,
            name: `Shiny ${formatCostumeName(costume.name)} ${pokemon.name}`
          };
          addVariant(shinyCostumeVariant, `costume_${costume.costume_id}_shiny`);
        }
        if (costume.shadow_costume) {
          const shadowCostumeVariant = {
            ...pokemon,
            currentImage: costume.shadow_costume.image_url_shadow_costume,
            variantType: `shadow_costume_${costume.costume_id}`,
            name: `Shadow ${formatCostumeName(costume.name)} ${pokemon.name}`
          };
          addVariant(shadowCostumeVariant, `shadow_costume_${costume.costume_id}`);
        }
      });
    }

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
          type_1_id: megaEvolution.type_1_id,
          type_2_id: megaEvolution.type_2_id,
          type1_name: megaEvolution.type1_name,
          type2_name: megaEvolution.type2_name,
          type_1_icon: `/images/types/${megaEvolution.type1_name.toLowerCase()}.png`,
          type_2_icon: megaEvolution.type2_name ? `/images/types/${megaEvolution.type2_name.toLowerCase()}.png` : null,
          currentImage: megaEvolution.image_url,
          name: megaEvolution.primal
            ? `Primal ${pokemon.name}`
            : `Mega ${pokemon.name} ${megaEvolution.form ? megaEvolution.form : ''}`.trim(),
          variantType: megaEvolution.primal ? `primal` : `mega${formSuffix}`,
          cp40: megaEvolution.cp40 || pokemon.cp40,
          cp50: megaEvolution.cp50 || pokemon.cp50
        };

        addVariant(baseVariant, megaEvolution.primal ? `primal` : `mega${formSuffix}`);

        // Specific Handling for Shiny Mega Variants
        if (megaEvolution.image_url_shiny && pokemon.shiny_available) {
          const shinyVariant = {
            ...baseVariant,
            currentImage: megaEvolution.image_url_shiny,
            name: megaEvolution.primal
              ? `Shiny Primal ${pokemon.name}`
              : `Shiny Mega ${pokemon.name} ${megaEvolution.form ? megaEvolution.form : ''}`.trim(),
            variantType: megaEvolution.primal ? `shiny_primal` : `shiny_mega${formSuffix}`,
            cp40: megaEvolution.cp40 || pokemon.cp40,
            cp50: megaEvolution.cp50 || pokemon.cp50
          };
          addVariant(shinyVariant, megaEvolution.primal ? `shiny_primal` : `shiny_mega${formSuffix}`);
        }
      });
    }

    // New section: Create variants for each fusion entry
    if (pokemon.fusion && pokemon.fusion.length > 0) {
      pokemon.fusion.forEach(fusion => {
        // Only create a variant if the current Pokémon matches the first base of the fusion
        if (pokemon.pokemon_id !== fusion.base_pokemon_id1) {
          return; // Skip creating variants for this fusion if not the primary base
        }

        const fusionVariant = {
          ...pokemon,
          attack: fusion.attack || pokemon.attack,
          defense: fusion.defense || pokemon.defense,
          stamina: fusion.stamina || pokemon.stamina,
          type_1_id: fusion.type_1_id,
          type_2_id: fusion.type_2_id,
          type1_name: fusion.type1_name,
          type2_name: fusion.type2_name,
          type_1_icon: `/images/types/${fusion.type1_name.toLowerCase()}.png`,
          type_2_icon: fusion.type2_name ? `/images/types/${fusion.type2_name.toLowerCase()}.png` : null,
          image_url: fusion.image_url || pokemon.image_url,
          image_url_shiny: fusion.image_url_shiny || pokemon.image_url_shiny,
          sprite_url: fusion.sprite_url || pokemon.sprite_url,
          currentImage: fusion.image_url || pokemon.image_url,
          name: fusion.name,
          variantType: `fusion_${fusion.fusion_id}`,
          cp40: fusion.cp40 || pokemon.cp40,
          cp50: fusion.cp50 || pokemon.cp50
        };
        addVariant(fusionVariant, fusionVariant.variantType);

        if (fusion.image_url_shiny) {
          const shinyFusionVariant = {
            ...pokemon,
            attack: fusion.attack || pokemon.attack,
            defense: fusion.defense || pokemon.defense,
            stamina: fusion.stamina || pokemon.stamina,
            type_1_id: fusion.type_1_id,
            type_2_id: fusion.type_2_id,
            type1_name: fusion.type1_name,
            type2_name: fusion.type2_name,
            type_1_icon: `/images/types/${fusion.type1_name.toLowerCase()}.png`,
            type_2_icon: fusion.type2_name ? `/images/types/${fusion.type2_name.toLowerCase()}.png` : null,
            image_url: fusion.image_url,
            image_url_shiny: fusion.image_url_shiny,
            sprite_url: fusion.sprite_url,
            currentImage: fusion.image_url_shiny,
            name: `Shiny ${fusion.name}`,
            variantType: `shiny_fusion_${fusion.fusion_id}`,
            cp40: fusion.cp40 || pokemon.cp40,
            cp50: fusion.cp50 || pokemon.cp50
          };
          addVariant(shinyFusionVariant, shinyFusionVariant.variantType);
        }
      });
    }

    // Gigantamax Variants
    if (pokemon.max && pokemon.max.length > 0) {
      pokemon.max.forEach(maxEntry => {
        if (maxEntry.gigantamax) {
          // Gigantamax Variant
          const gigantamaxVariant = {
            ...pokemon,
            currentImage: maxEntry.gigantamax_image_url,
            name: `Gigantamax ${pokemon.name}`,
            variantType: 'gigantamax'
          };
          addVariant(gigantamaxVariant, 'gigantamax');

          // Shiny Gigantamax Variant
          if (maxEntry.shiny_gigantamax_image_url) {
            const shinyGigantamaxVariant = {
              ...pokemon,
              currentImage: maxEntry.shiny_gigantamax_image_url,
              name: `Shiny Gigantamax ${pokemon.name}`,
              variantType: 'shiny_gigantamax'
            };
            addVariant(shinyGigantamaxVariant, 'shiny_gigantamax');
          }
        }
      });
    }

    // Remove raid boss data from variants that do not meet the criteria
    variants = variants.map(variant => {
      const raidBossForms = pokemon.raid_boss.map(rb => rb.form);
      const matchResult = raidBossForms.some(raidBossForm =>
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
