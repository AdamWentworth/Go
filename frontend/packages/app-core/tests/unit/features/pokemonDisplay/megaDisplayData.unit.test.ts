import { describe, expect, it } from 'vitest';

import { resolveMegaDisplayData } from '@/features/pokemonDisplay/megaDisplayData';
import type { MegaEvolution } from '@/types/pokemonSubTypes';

const baseSizes = {
  pokedex_height: 1.7,
  pokedex_weight: 90.5,
  height_standard_deviation: 0.21,
  weight_standard_deviation: 11.3,
  height_xxs_threshold: 1.28,
  height_xs_threshold: 1.49,
  height_xl_threshold: 1.91,
  height_xxl_threshold: 2.13,
  weight_xxs_threshold: 67.8,
  weight_xs_threshold: 79.1,
  weight_xl_threshold: 101.8,
  weight_xxl_threshold: 113.1,
};

const megaSizes = {
  pokedex_height: 2.0,
  pokedex_weight: 110.2,
  height_standard_deviation: 0.25,
  weight_standard_deviation: 13.7,
  height_xxs_threshold: 1.5,
  height_xs_threshold: 1.75,
  height_xl_threshold: 2.25,
  height_xxl_threshold: 2.5,
  weight_xxs_threshold: 82.6,
  weight_xs_threshold: 96.4,
  weight_xl_threshold: 124,
  weight_xxl_threshold: 137.8,
};

const megaEvolutions: MegaEvolution[] = [
  {
    id: 1,
    form: 'X',
    date_available: '2019-01-01T00:00:00Z',
    mega_energy_cost: 200,
    type1_name: 'Fire',
    type2_name: 'Dragon',
    type_1_id: 10,
    type_2_id: 3,
    attack: 273,
    defense: 213,
    stamina: 186,
    image_url: '/images/default/pokemon_6_mega_x.png',
    image_url_shiny: '/images/shiny/shiny_pokemon_6_mega_x.png',
  },
];

describe('resolveMegaDisplayData', () => {
  it('returns base type and size data when mega is not active', () => {
    const result = resolveMegaDisplayData({
      pokemon: {
        pokemon_id: 6,
        type1_name: 'Fire',
        type2_name: 'Flying',
        type_1_icon: '/images/types/fire.png',
        type_2_icon: '/images/types/flying.png',
        sizes: baseSizes,
        megaEvolutions,
      },
      variants: [],
      mega: {
        is_mega: false,
        mega_form: null,
      },
    });

    expect(result.source).toBe('base');
    expect(result.type1_name).toBe('Fire');
    expect(result.type2_name).toBe('Flying');
    expect(result.sizes).toEqual(baseSizes);
  });

  it('uses mega types and mega variant sizes when mega is active', () => {
    const result = resolveMegaDisplayData({
      pokemon: {
        pokemon_id: 6,
        type1_name: 'Fire',
        type2_name: 'Flying',
        type_1_icon: '/images/types/fire.png',
        type_2_icon: '/images/types/flying.png',
        sizes: baseSizes,
        megaEvolutions,
      },
      variants: [
        {
          pokemon_id: 6,
          variantType: 'mega_x',
          megaForm: 'X',
          type1_name: 'Fire',
          type2_name: 'Dragon',
          type_1_icon: '/images/types/fire.png',
          type_2_icon: '/images/types/dragon.png',
          sizes: megaSizes,
        } as any,
      ],
      mega: {
        is_mega: true,
        mega_form: 'X',
      },
    });

    expect(result.source).toBe('mega');
    expect(result.type1_name).toBe('Fire');
    expect(result.type2_name).toBe('Dragon');
    expect(result.type_2_icon).toBe('/images/types/dragon.png');
    expect(result.sizes).toEqual(megaSizes);
  });

  it('falls back to base sizes when mega variant metadata is missing', () => {
    const result = resolveMegaDisplayData({
      pokemon: {
        pokemon_id: 6,
        type1_name: 'Fire',
        type2_name: 'Flying',
        type_1_icon: '/images/types/fire.png',
        type_2_icon: '/images/types/flying.png',
        sizes: baseSizes,
        megaEvolutions,
      },
      variants: [],
      mega: {
        is_mega: true,
        mega_form: 'X',
      },
    });

    expect(result.source).toBe('mega');
    expect(result.type1_name).toBe('Fire');
    expect(result.type2_name).toBe('Dragon');
    expect(result.sizes).toEqual(baseSizes);
  });

  it('clears secondary type when mega form has no secondary typing', () => {
    const result = resolveMegaDisplayData({
      pokemon: {
        pokemon_id: 306,
        type1_name: 'Steel',
        type2_name: 'Rock',
        type_1_icon: '/images/types/steel.png',
        type_2_icon: '/images/types/rock.png',
        sizes: baseSizes,
        megaEvolutions: [
          {
            id: 2,
            form: null,
            date_available: '2019-01-01T00:00:00Z',
            mega_energy_cost: 200,
            type1_name: 'Steel',
            type_1_id: 17,
            attack: 247,
            defense: 331,
            stamina: 172,
          },
        ],
      },
      variants: [],
      mega: {
        is_mega: true,
        mega_form: null,
      },
    });

    expect(result.source).toBe('mega');
    expect(result.type1_name).toBe('Steel');
    expect(result.type2_name).toBeUndefined();
    expect(result.type_2_icon).toBeUndefined();
  });
});
