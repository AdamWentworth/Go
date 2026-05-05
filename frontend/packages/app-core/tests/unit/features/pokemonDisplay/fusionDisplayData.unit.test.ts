import { describe, expect, it } from 'vitest';

import { resolveFusionDisplayData } from '@/features/pokemonDisplay/fusionDisplayData';
import type { Fusion } from '@/types/pokemonSubTypes';

const baseSizes = {
  pokedex_height: 3.0,
  pokedex_weight: 325,
  height_standard_deviation: 0.38,
  weight_standard_deviation: 40.6,
  height_xxs_threshold: 2.25,
  height_xs_threshold: 2.63,
  height_xl_threshold: 3.38,
  height_xxl_threshold: 3.75,
  weight_xxs_threshold: 243.8,
  weight_xs_threshold: 284.4,
  weight_xl_threshold: 365.6,
  weight_xxl_threshold: 406.3,
};

const fusionSizes = {
  pokedex_height: 3.6,
  pokedex_weight: 340,
  height_standard_deviation: 0.45,
  weight_standard_deviation: 42.5,
  height_xxs_threshold: 2.7,
  height_xs_threshold: 3.15,
  height_xl_threshold: 4.05,
  height_xxl_threshold: 4.5,
  weight_xxs_threshold: 255,
  weight_xs_threshold: 297.5,
  weight_xl_threshold: 382.5,
  weight_xxl_threshold: 425,
};

const fusionEntries: Fusion[] = [
  {
    fusion_id: 3,
    date_available: '2025-02-21T00:00:00Z',
    base_pokemon_id1: 646,
    base_pokemon_id2: 643,
    name: 'White Kyurem',
    type_1_id: 3,
    type_2_id: 12,
    type1_name: 'Dragon',
    type2_name: 'Ice',
    image_url: '/images/fusion/fusion_3.png',
    image_url_shiny: '/images/fusion/shiny_fusion_3.png',
  },
];

describe('resolveFusionDisplayData', () => {
  it('returns base type and size data when fusion is not active', () => {
    const result = resolveFusionDisplayData({
      pokemon: {
        pokemon_id: 646,
        type1_name: 'Dragon',
        type2_name: 'Ice',
        type_1_icon: '/images/types/dragon.png',
        type_2_icon: '/images/types/ice.png',
        sizes: baseSizes,
        fusion: fusionEntries,
      },
      variants: [],
      fusion: {
        is_fused: false,
        fusion_form: null,
      },
    });

    expect(result.source).toBe('base');
    expect(result.type1_name).toBe('Dragon');
    expect(result.sizes).toEqual(baseSizes);
  });

  it('uses fusion types and fusion variant sizes when fused', () => {
    const result = resolveFusionDisplayData({
      pokemon: {
        pokemon_id: 646,
        type1_name: 'Dragon',
        type2_name: 'Ice',
        type_1_icon: '/images/types/dragon.png',
        type_2_icon: '/images/types/ice.png',
        sizes: baseSizes,
        fusion: fusionEntries,
      },
      variants: [
        {
          pokemon_id: 646,
          variantType: 'fusion_3',
          type1_name: 'Dragon',
          type2_name: 'Ice',
          type_1_icon: '/images/types/dragon.png',
          type_2_icon: '/images/types/ice.png',
          sizes: fusionSizes,
        } as any,
      ],
      fusion: {
        is_fused: true,
        fusion_form: 'White Kyurem',
        storedFusionObject: null,
      },
    });

    expect(result.source).toBe('fusion');
    expect(result.fusionId).toBe(3);
    expect(result.type1_name).toBe('Dragon');
    expect(result.type2_name).toBe('Ice');
    expect(result.sizes).toEqual(fusionSizes);
  });

  it('falls back to base sizes when fusion variant metadata is missing', () => {
    const result = resolveFusionDisplayData({
      pokemon: {
        pokemon_id: 646,
        type1_name: 'Dragon',
        type2_name: 'Ice',
        type_1_icon: '/images/types/dragon.png',
        type_2_icon: '/images/types/ice.png',
        sizes: baseSizes,
        fusion: fusionEntries,
      },
      variants: [],
      fusion: {
        is_fused: true,
        fusion_form: 'White Kyurem',
        storedFusionObject: null,
      },
    });

    expect(result.source).toBe('fusion');
    expect(result.type1_name).toBe('Dragon');
    expect(result.type2_name).toBe('Ice');
    expect(result.sizes).toEqual(baseSizes);
  });
});
