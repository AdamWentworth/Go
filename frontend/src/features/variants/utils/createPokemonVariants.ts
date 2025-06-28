// createPokemonVariants.ts

import { determinePokemonKey } from '../../../utils/PokemonIDUtils';
import { matchFormsAndVariantType } from '../../../utils/formMatcher';
import { getDisplayName } from '../../../utils/displayName';

import type { BasePokemon } from '../../../types/pokemonBase';
import type { PokemonVariant, VariantKind } from '../../../types/pokemonVariants';
import type { Costume, MegaEvolution, Fusion, MaxForm, RaidBoss } from '../../../types/pokemonSubTypes';

// Utility for constructing type icons
const getTypeIcon = (typeName?: string) =>
  typeName ? `/images/types/${typeName.toLowerCase()}.png` : '';

const createPokemonVariants = (pokemons: BasePokemon[]): PokemonVariant[] => {
  const generateVariants = (pokemon: BasePokemon): PokemonVariant[] => {
    const variants: PokemonVariant[] = [];

    // Helper to add a variant and compute its pokemonKey
    const addVariant = (variant: PokemonVariant) => {
      variant.pokemonKey = determinePokemonKey(variant);
      variants.push(variant);
    };

    /* ---------- default variant ---------- */
    const defaultVariant: PokemonVariant = {
      ...pokemon,
      type_1_icon: pokemon.type_1_icon || '',
      type_2_icon: pokemon.type_2_icon || '',
      species_name: pokemon.name,
      currentImage: pokemon.image_url,
      variantType: 'default',
      pokemonKey: '',
    };
    defaultVariant.name = getDisplayName(defaultVariant);
    addVariant(defaultVariant);

    /* ---------- shiny variant ---------- */
    if (pokemon.shiny_available) {
      const shinyVariant: PokemonVariant = {
        ...defaultVariant,
        currentImage: pokemon.image_url_shiny,
        variantType: 'shiny',
      };
      shinyVariant.name = getDisplayName(shinyVariant);
      addVariant(shinyVariant);
    }

    /* ---------- shadow & shiny shadow variants ---------- */
    if (pokemon.date_shadow_available) {
      const shadowVariant: PokemonVariant = {
        ...defaultVariant,
        currentImage: pokemon.image_url_shadow || pokemon.image_url,
        variantType: 'shadow',
      };
      shadowVariant.name = getDisplayName(shadowVariant);
      addVariant(shadowVariant);

      if (pokemon.date_shiny_shadow_available) {
        const shinyShadowVariant: PokemonVariant = {
          ...defaultVariant,
          currentImage: pokemon.image_url_shiny_shadow || pokemon.image_url_shiny,
          variantType: 'shiny_shadow',
        };
        shinyShadowVariant.name = getDisplayName(shinyShadowVariant);
        addVariant(shinyShadowVariant);
      }
    }

    /* ---------- costume variants ---------- */
    pokemon.costumes?.forEach((c) => {
      const costume = c as Costume;

      const costumeVariant: PokemonVariant = {
        ...defaultVariant,
        currentImage: costume.image_url,
        variantType: `costume_${costume.costume_id}` as VariantKind,
      };
      costumeVariant.name = getDisplayName(costumeVariant);
      addVariant(costumeVariant);

      if (costume.shiny_available && costume.image_url_shiny) {
        const costumeShinyVariant: PokemonVariant = {
          ...defaultVariant,
          currentImage: costume.image_url_shiny,
          variantType: `costume_${costume.costume_id}_shiny` as VariantKind,
        };
        costumeShinyVariant.name = getDisplayName(costumeShinyVariant);
        addVariant(costumeShinyVariant);
      }

      if (costume.shadow_costume && costume.shadow_costume.image_url_shadow_costume) {
        const shadowCostumeVariant: PokemonVariant = {
          ...defaultVariant,
          currentImage: costume.shadow_costume.image_url_shadow_costume,
          variantType: `shadow_costume_${costume.costume_id}` as VariantKind,
        };
        shadowCostumeVariant.name = getDisplayName(shadowCostumeVariant);
        addVariant(shadowCostumeVariant);
      }
    });

    /* ---------- max forms: Dynamax & Gigantamax ---------- */
    pokemon.max?.forEach((mx) => {
      const maxForm = mx as MaxForm;
      if (maxForm.dynamax) {
        const dynamaxVariant: PokemonVariant = {
          ...defaultVariant,
          currentImage: defaultVariant.image_url,
          variantType: 'dynamax',
        };
        dynamaxVariant.name = getDisplayName(dynamaxVariant);
        addVariant(dynamaxVariant);

        if (pokemon.shiny_available) {
          const shinyDynamaxVariant: PokemonVariant = {
            ...defaultVariant,
            currentImage: defaultVariant.image_url_shiny,
            variantType: 'shiny_dynamax',
          };
          shinyDynamaxVariant.name = getDisplayName(shinyDynamaxVariant);
          addVariant(shinyDynamaxVariant);
        }
      }

      if (maxForm.gigantamax) {
        const gigantamaxVariant: PokemonVariant = {
          ...defaultVariant,
          currentImage: maxForm.gigantamax_image_url || defaultVariant.image_url,
          variantType: 'gigantamax',
        };
        gigantamaxVariant.name = getDisplayName(gigantamaxVariant);
        addVariant(gigantamaxVariant);

        if (maxForm.shiny_gigantamax_image_url) {
          const shinyGigantamaxVariant: PokemonVariant = {
            ...defaultVariant,
            currentImage: maxForm.shiny_gigantamax_image_url,
            variantType: 'shiny_gigantamax',
          };
          shinyGigantamaxVariant.name = getDisplayName(shinyGigantamaxVariant);
          addVariant(shinyGigantamaxVariant);
        }
      }
    });

    /* ---------- mega / primal variants ---------- */
    pokemon.megaEvolutions?.forEach((m) => {
      const mega = m as MegaEvolution;
      const suffix = mega.form ? `_${mega.form.toLowerCase()}` : '';
      const base: PokemonVariant = {
        ...defaultVariant,
        attack: mega.attack ?? defaultVariant.attack,
        defense: mega.defense ?? defaultVariant.defense,
        stamina: mega.stamina ?? defaultVariant.stamina,
        image_url: mega.image_url ?? defaultVariant.image_url,
        image_url_shiny: mega.image_url_shiny ?? defaultVariant.image_url_shiny,
        sprite_url: mega.sprite_url ?? defaultVariant.sprite_url,
        primal: mega.primal ?? defaultVariant.primal,
        form: mega.form ?? defaultVariant.form,
        type_1_id: mega.type_1_id,
        type_2_id: mega.type_2_id ?? defaultVariant.type_2_id,
        type_1_icon: getTypeIcon(mega.type1_name),
        type_2_icon: getTypeIcon(mega.type2_name),
        currentImage: mega.image_url || defaultVariant.image_url,
        cp40: mega.cp40 ?? defaultVariant.cp40,
        cp50: mega.cp50 ?? defaultVariant.cp50,
        megaForm: mega.form ?? '',
        variantType: (mega.primal ? 'primal' : `mega${suffix}`) as VariantKind,
      };
      base.name = getDisplayName(base);
      addVariant(base);

      if (mega.image_url_shiny && pokemon.shiny_available) {
        const shinyMegaVariant: PokemonVariant = {
          ...base,
          currentImage: mega.image_url_shiny,
          variantType: (mega.primal ? 'shiny_primal' : `shiny_mega${suffix}`) as VariantKind,
        };
        shinyMegaVariant.name = getDisplayName(shinyMegaVariant);
        addVariant(shinyMegaVariant);
      }
    });

    /* ---------- fusion variants ---------- */
    pokemon.fusion?.forEach((f) => {
      const fusion = f as Fusion;
      if (pokemon.pokemon_id !== fusion.base_pokemon_id1) return;
      const base: PokemonVariant = {
        ...defaultVariant,
        attack: fusion.attack ?? defaultVariant.attack,
        defense: fusion.defense ?? defaultVariant.defense,
        stamina: fusion.stamina ?? defaultVariant.stamina,
        type_1_id: fusion.type_1_id,
        type_2_id: fusion.type_2_id ?? defaultVariant.type_2_id,
        type_1_icon: getTypeIcon(fusion.type1_name),
        type_2_icon: getTypeIcon(fusion.type2_name),
        currentImage: fusion.image_url ?? defaultVariant.image_url,
        fusion_id: fusion.fusion_id,
        variantType: `fusion_${fusion.fusion_id}` as VariantKind,
        species_name: fusion.name,
        name: fusion.name,
      };
      base.name = getDisplayName(base);
      addVariant(base);

      if (fusion.image_url_shiny) {
        const shinyFusionVariant: PokemonVariant = {
          ...base,
          currentImage: fusion.image_url_shiny,
          variantType: `shiny_fusion_${fusion.fusion_id}` as VariantKind,
          name: `${fusion.name}`,
          species_name: fusion.name,
        };
        shinyFusionVariant.name = getDisplayName(shinyFusionVariant);
        addVariant(shinyFusionVariant);
      }
    });

    /* ---------- raid‑boss filter ---------- */
    return variants.map((v) => {
      const raidForms = (pokemon.raid_boss || []).map((rb: RaidBoss) => rb.form);
      if (raidForms.some((f: string) => matchFormsAndVariantType(v.form, f, v.variantType))) {
        return v;
      } else {
        // Remove the raid_boss property if no match, but return the variant
        const { raid_boss, ...rest } = v;
        return rest as PokemonVariant;
      }
    });
  };

  return pokemons.flatMap(generateVariants);
};

export default createPokemonVariants;
