import { describe, expect, it } from 'vitest';

import { resolveCrownDisplayData } from '@/pages/Pokemon/features/instances/utils/resolveCrownDisplayData';
import type { CrownForm } from '@/types/pokemonSubTypes';

const baseSizes = {
  pokedex_height: 2.8,
  pokedex_weight: 355,
  height_standard_deviation: 0.35,
  weight_standard_deviation: 44.3,
  height_xxs_threshold: 2.1,
  height_xs_threshold: 2.45,
  height_xl_threshold: 3.15,
  height_xxl_threshold: 3.5,
  weight_xxs_threshold: 267,
  weight_xs_threshold: 311,
  weight_xl_threshold: 399,
  weight_xxl_threshold: 443,
};

const crownSizes = {
  pokedex_height: 3.1,
  pokedex_weight: 420,
  height_standard_deviation: 0.39,
  weight_standard_deviation: 52.5,
  height_xxs_threshold: 2.33,
  height_xs_threshold: 2.72,
  height_xl_threshold: 3.49,
  height_xxl_threshold: 3.88,
  weight_xxs_threshold: 315,
  weight_xs_threshold: 368,
  weight_xl_threshold: 473,
  weight_xxl_threshold: 526,
};

const crownForms: CrownForm[] = [
  {
    id: 1,
    base_pokemon_id: 2290,
    crown_pokemon_id: 888,
    display_form: 'Crowned Sword',
    name: 'Zacian',
    form: 'Crowned_sword',
    type_1_id: 17,
    type_2_id: 18,
    type1_name: 'Steel',
    type2_name: 'Fairy',
  },
];

describe('resolveCrownDisplayData', () => {
  it('returns base type and size data when crown is not active', () => {
    const result = resolveCrownDisplayData({
      pokemon: {
        type1_name: 'Fairy',
        type2_name: undefined,
        type_1_icon: '/images/types/fairy.png',
        type_2_icon: '',
        sizes: baseSizes,
        crownForms,
      },
      variants: [],
      crown: {
        is_crown: false,
        crown_form: null,
      },
    });

    expect(result.source).toBe('base');
    expect(result.type1_name).toBe('Fairy');
    expect(result.sizes).toEqual(baseSizes);
  });

  it('uses crown form types and crown pokemon sizes when crown is active', () => {
    const result = resolveCrownDisplayData({
      pokemon: {
        type1_name: 'Fairy',
        type2_name: undefined,
        type_1_icon: '/images/types/fairy.png',
        type_2_icon: '',
        sizes: baseSizes,
        crownForms,
      },
      variants: [
        {
          pokemon_id: 888,
          variantType: 'default',
          type1_name: 'Steel',
          type2_name: 'Fairy',
          type_1_icon: '/images/types/steel.png',
          type_2_icon: '/images/types/fairy.png',
          sizes: crownSizes,
        } as any,
      ],
      crown: {
        is_crown: true,
        crown_form: 'Crowned Sword',
      },
    });

    expect(result.source).toBe('crown');
    expect(result.crownPokemonId).toBe(888);
    expect(result.type1_name).toBe('Steel');
    expect(result.type2_name).toBe('Fairy');
    expect(result.type_1_icon).toBe('/images/types/steel.png');
    expect(result.sizes).toEqual(crownSizes);
  });

  it('falls back to base sizes when crown pokemon variant is missing', () => {
    const result = resolveCrownDisplayData({
      pokemon: {
        type1_name: 'Fairy',
        type2_name: undefined,
        type_1_icon: '/images/types/fairy.png',
        type_2_icon: '',
        sizes: baseSizes,
        crownForms,
      },
      variants: [],
      crown: {
        is_crown: true,
        crown_form: 'Crowned Sword',
      },
    });

    expect(result.source).toBe('crown');
    expect(result.type1_name).toBe('Steel');
    expect(result.sizes).toEqual(baseSizes);
  });
});
