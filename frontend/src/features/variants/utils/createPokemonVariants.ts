// src/features/variants/utils/createPokemonVariants.ts
import { determineVariantId } from '../../../utils/PokemonIDUtils';
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
    const raidForms = ((pokemon as any).raid_boss || []).map((rb: RaidBoss) => rb.form);

    // Finalize in one place to avoid duplicate transform work.
    const addVariant = (variant: PokemonVariant) => {
      variant.variant_id = determineVariantId(variant);
      (variant as any).name = getDisplayName(variant);

      const shouldKeepRaidBoss = raidForms.some((form: string) =>
        matchFormsAndVariantType((variant as any).form, form, variant.variantType),
      );

      if (shouldKeepRaidBoss) {
        variants.push(variant);
      } else {
        const { raid_boss, ...rest } = variant as any;
        variants.push(rest as PokemonVariant);
      }
    };

    /* ---------- default variant ---------- */
    const defaultVariant: PokemonVariant = {
      ...pokemon,
      type_1_icon: (pokemon as any).type_1_icon || '',
      type_2_icon: (pokemon as any).type_2_icon || '',
      species_name: (pokemon as any).name,
      currentImage: (pokemon as any).image_url,
      variantType: 'default',
      variant_id: '',
    } as unknown as PokemonVariant;
    addVariant(defaultVariant);

    /* ---------- shiny variant ---------- */
    if ((pokemon as any).shiny_available) {
      const shinyVariant: PokemonVariant = {
        ...defaultVariant,
        currentImage: (pokemon as any).image_url_shiny,
        variantType: 'shiny',
      };
      addVariant(shinyVariant);
    }

    /* ---------- shadow & shiny shadow variants ---------- */
    if ((pokemon as any).date_shadow_available) {
      const shadowVariant: PokemonVariant = {
        ...defaultVariant,
        currentImage: (pokemon as any).image_url_shadow || (pokemon as any).image_url,
        variantType: 'shadow',
      };
      addVariant(shadowVariant);

      if ((pokemon as any).date_shiny_shadow_available) {
        const shinyShadowVariant: PokemonVariant = {
          ...defaultVariant,
          currentImage: (pokemon as any).image_url_shiny_shadow || (pokemon as any).image_url_shiny,
          variantType: 'shiny_shadow',
        };
        addVariant(shinyShadowVariant);
      }
    }

    /* ---------- costume variants ---------- */
    (pokemon as any).costumes?.forEach((c: any) => {
      const costume = c as Costume;

      const costumeVariant: PokemonVariant = {
        ...defaultVariant,
        currentImage: costume.image_url,
        variantType: `costume_${costume.costume_id}` as VariantKind,
      };
      addVariant(costumeVariant);

      if (costume.shiny_available && costume.image_url_shiny) {
        const costumeShinyVariant: PokemonVariant = {
          ...defaultVariant,
          currentImage: costume.image_url_shiny,
          variantType: `costume_${costume.costume_id}_shiny` as VariantKind,
        };
        addVariant(costumeShinyVariant);
      }

      if (costume.shadow_costume && costume.shadow_costume.image_url_shadow_costume) {
        const shadowCostumeVariant: PokemonVariant = {
          ...defaultVariant,
          currentImage: costume.shadow_costume.image_url_shadow_costume,
          variantType: `shadow_costume_${costume.costume_id}` as VariantKind,
        };
        addVariant(shadowCostumeVariant);
      }
    });

    /* ---------- max forms: Dynamax & Gigantamax ---------- */
    (pokemon as any).max?.forEach((mx: any) => {
      const maxForm = mx as MaxForm;
      if (maxForm.dynamax) {
        const dynamaxVariant: PokemonVariant = {
          ...defaultVariant,
          currentImage: (defaultVariant as any).image_url,
          variantType: 'dynamax',
        };
        addVariant(dynamaxVariant);

        if ((pokemon as any).shiny_available) {
          const shinyDynamaxVariant: PokemonVariant = {
            ...defaultVariant,
            currentImage: (defaultVariant as any).image_url_shiny,
            variantType: 'shiny_dynamax',
          };
          addVariant(shinyDynamaxVariant);
        }
      }

      if (maxForm.gigantamax) {
        const gigantamaxVariant: PokemonVariant = {
          ...defaultVariant,
          currentImage: maxForm.gigantamax_image_url || (defaultVariant as any).image_url,
          variantType: 'gigantamax',
        };
        addVariant(gigantamaxVariant);

        if ((pokemon as any).shiny_available && maxForm.shiny_gigantamax_image_url) {
          const shinyGigantamaxVariant: PokemonVariant = {
            ...defaultVariant,
            currentImage: maxForm.shiny_gigantamax_image_url,
            variantType: 'shiny_gigantamax',
          };
          addVariant(shinyGigantamaxVariant);
        }
      }
    });

    /* ---------- mega / primal variants ---------- */
    (pokemon as any).megaEvolutions?.forEach((m: any) => {
      const mega = m as MegaEvolution;
      const suffix = mega.form ? `_${mega.form.toLowerCase()}` : '';
      const base: PokemonVariant = {
        ...defaultVariant,
        attack: mega.attack ?? (defaultVariant as any).attack,
        defense: mega.defense ?? (defaultVariant as any).defense,
        stamina: mega.stamina ?? (defaultVariant as any).stamina,
        image_url: mega.image_url ?? (defaultVariant as any).image_url,
        image_url_shiny: mega.image_url_shiny ?? (defaultVariant as any).image_url_shiny,
        sprite_url: mega.sprite_url ?? (defaultVariant as any).sprite_url,
        primal: mega.primal ?? (defaultVariant as any).primal,
        form: mega.form ?? (defaultVariant as any).form,
        type_1_id: mega.type_1_id,
        type_2_id: mega.type_2_id ?? (defaultVariant as any).type_2_id,
        type_1_icon: getTypeIcon((mega as any).type1_name),
        type_2_icon: getTypeIcon((mega as any).type2_name),
        currentImage: mega.image_url || (defaultVariant as any).image_url,
        cp40: mega.cp40 ?? (defaultVariant as any).cp40,
        cp50: mega.cp50 ?? (defaultVariant as any).cp50,
        megaForm: mega.form ?? '',
        variantType: (mega.primal ? 'primal' : `mega${suffix}`) as VariantKind,
        variant_id: '',
        species_name: (defaultVariant as any).species_name,
      } as unknown as PokemonVariant;
      addVariant(base);

      if (mega.image_url_shiny && (pokemon as any).shiny_available) {
        const shinyMegaVariant: PokemonVariant = {
          ...base,
          currentImage: mega.image_url_shiny,
          variantType: (mega.primal ? 'shiny_primal' : `shiny_mega${suffix}`) as VariantKind,
        };
        addVariant(shinyMegaVariant);
      }
    });

    /* ---------- fusion variants ---------- */
    (pokemon as any).fusion?.forEach((f: any) => {
      const fusion = f as Fusion;
      if ((pokemon as any).pokemon_id !== fusion.base_pokemon_id1) return;
      const base: PokemonVariant = {
        ...defaultVariant,
        attack: fusion.attack ?? (defaultVariant as any).attack,
        defense: fusion.defense ?? (defaultVariant as any).defense,
        stamina: fusion.stamina ?? (defaultVariant as any).stamina,
        type_1_id: fusion.type_1_id,
        type_2_id: fusion.type_2_id ?? (defaultVariant as any).type_2_id,
        type_1_icon: getTypeIcon((fusion as any).type1_name),
        type_2_icon: getTypeIcon((fusion as any).type2_name),
        currentImage: fusion.image_url ?? (defaultVariant as any).image_url,
        fusion_id: fusion.fusion_id,
        variantType: `fusion_${fusion.fusion_id}` as VariantKind,
        species_name: fusion.name,
        variant_id: '',
      } as unknown as PokemonVariant;
      addVariant(base);

      if (fusion.image_url_shiny) {
        const shinyFusionVariant: PokemonVariant = {
          ...base,
          currentImage: fusion.image_url_shiny,
          variantType: `shiny_fusion_${fusion.fusion_id}` as VariantKind,
          species_name: fusion.name,
        };
        addVariant(shinyFusionVariant);
      }
    });
    return variants;
  };

  return pokemons.flatMap(generateVariants);
};

export default createPokemonVariants;
