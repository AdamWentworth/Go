import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';

import useSortManager from '@/hooks/sort/useSortManager';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { SortType } from '@/types/sort';

const buildVariant = (
  variant_id: string,
  overrides: Partial<PokemonVariant> = {},
): PokemonVariant =>
  ({
    variant_id,
    variantType: 'default',
    currentImage: '/images/default.png',
    species_name: `Species ${variant_id}`,
    name: `Name ${variant_id}`,
    pokemon_id: 1,
    pokedex_number: 1,
    attack: 1,
    defense: 1,
    stamina: 1,
    type_1_id: 1,
    type_2_id: 0,
    gender_rate: '50_50_0',
    rarity: 'common',
    form: null,
    generation: 1,
    available: 1,
    shiny_available: 1,
    shiny_rarity: 'common',
    date_available: '2020-01-01',
    date_shiny_available: '2020-01-01',
    female_unique: 0,
    type1_name: 'Normal',
    type2_name: '',
    shadow_shiny_available: 0,
    shadow_apex: null,
    date_shadow_available: '2020-01-01',
    date_shiny_shadow_available: '2020-01-01',
    shiny_shadow_rarity: null,
    image_url: '/images/default.png',
    image_url_shadow: '/images/shadow.png',
    image_url_shiny: '/images/shiny.png',
    image_url_shiny_shadow: '/images/shiny_shadow.png',
    type_1_icon: '/images/types/normal.png',
    type_2_icon: '',
    costumes: [],
    moves: [],
    fusion: [],
    backgrounds: [],
    cp40: 100,
    cp50: 100,
    evolves_from: [],
    megaEvolutions: [],
    raid_boss: [],
    sizes: {
      pokedex_height: 1,
      pokedex_weight: 1,
      height_standard_deviation: 1,
      weight_standard_deviation: 1,
      height_xxs_threshold: 1,
      height_xs_threshold: 1,
      height_xl_threshold: 1,
      height_xxl_threshold: 1,
      weight_xxs_threshold: 1,
      weight_xs_threshold: 1,
      weight_xl_threshold: 1,
      weight_xxl_threshold: 1,
    },
    max: [],
    sprite_url: null,
    ...overrides,
  }) as PokemonVariant;

describe('useSortManager', () => {
  it('supports sortType changes across rerenders without hook-order regressions', () => {
    const favoriteFirst = buildVariant('fav', {
      pokedex_number: 2,
      cp50: 500,
      instanceData: { favorite: true } as PokemonVariant['instanceData'],
    });
    const numberFirst = buildVariant('num', {
      pokedex_number: 1,
      cp50: 100,
      instanceData: { favorite: false } as PokemonVariant['instanceData'],
    });
    const variants = [favoriteFirst, numberFirst];

    const { result, rerender } = renderHook(
      ({ sortType }) => useSortManager(variants, sortType, 'ascending'),
      { initialProps: { sortType: 'number' as SortType } },
    );

    expect(result.current.map((v) => v.variant_id)).toEqual(['num', 'fav']);

    rerender({ sortType: 'favorite' as SortType });

    expect(result.current.map((v) => v.variant_id)).toEqual(['fav', 'num']);
  });

  it('returns original list for unsupported sort type fallback', () => {
    const variants = [
      buildVariant('a', { pokedex_number: 1 }),
      buildVariant('b', { pokedex_number: 2 }),
    ];

    const { result } = renderHook(() =>
      useSortManager(variants, 'unsupported' as SortType, 'ascending'),
    );

    expect(result.current).toBe(variants);
  });

  it('falls back to name when species_name is missing for name sort', () => {
    const missingSpeciesName = buildVariant('charizard', {
      species_name: undefined as unknown as string,
      name: 'Mega Charizard',
    });
    const bulbasaur = buildVariant('bulbasaur', {
      species_name: 'Bulbasaur',
      name: 'Bulbasaur',
    });

    const { result } = renderHook(() =>
      useSortManager([missingSpeciesName, bulbasaur], 'name', 'ascending'),
    );

    expect(result.current.map((v) => v.variant_id)).toEqual([
      'bulbasaur',
      'charizard',
    ]);
  });
});
