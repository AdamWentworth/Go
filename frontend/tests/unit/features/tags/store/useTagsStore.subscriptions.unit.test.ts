import { act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { useTagsStore } from '@/features/tags/store/useTagsStore';
import { useVariantsStore } from '@/features/variants/store/useVariantsStore';

import type { PokemonInstance } from '@/types/pokemonInstance';
import type { PokemonVariant } from '@/types/pokemonVariants';

function makeVariant(overrides: Partial<PokemonVariant> = {}): PokemonVariant {
  return {
    variant_id: '0001-default',
    pokemon_id: 1,
    name: 'Bulbasaur',
    form: null,
    variantType: 'default',
    currentImage: '/images/default/pokemon_1.png',
    stamina: 111,
    shiny_rarity: 'common',
    rarity: 'common',
    pokedex_number: 1,
    moves: [],
    type1_name: 'Grass',
    type2_name: 'Poison',
    type_1_icon: '/images/types/grass.png',
    type_2_icon: '/images/types/poison.png',
    ...overrides,
  } as PokemonVariant;
}

function makeInstance(overrides: Partial<PokemonInstance> = {}): PokemonInstance {
  return {
    instance_id: 'inst-1',
    variant_id: '0001-default',
    pokemon_id: 1,
    nickname: null,
    cp: 500,
    level: 25,
    attack_iv: 10,
    defense_iv: 10,
    stamina_iv: 10,
    shiny: false,
    costume_id: null,
    lucky: false,
    shadow: false,
    purified: false,
    fast_move_id: null,
    charged_move1_id: null,
    charged_move2_id: null,
    weight: null,
    height: null,
    gender: 'Male',
    mega: false,
    mega_form: null,
    is_mega: false,
    dynamax: false,
    gigantamax: false,
    crown: false,
    max_attack: null,
    max_guard: null,
    max_spirit: null,
    is_fused: false,
    fusion: null,
    fusion_form: null,
    fused_with: null,
    is_traded: false,
    traded_date: null,
    original_trainer_id: null,
    original_trainer_name: null,
    is_caught: false,
    is_for_trade: false,
    is_wanted: false,
    most_wanted: false,
    caught_tags: [],
    trade_tags: [],
    wanted_tags: [],
    not_trade_list: {},
    not_wanted_list: {},
    trade_filters: {},
    wanted_filters: {},
    mirror: false,
    pref_lucky: false,
    registered: false,
    favorite: false,
    disabled: false,
    pokeball: null,
    location_card: null,
    location_caught: null,
    date_caught: null,
    date_added: '2026-01-01T00:00:00.000Z',
    last_update: 12345,
    ...overrides,
  } as PokemonInstance;
}

describe('useTagsStore subscriptions', () => {
  beforeEach(() => {
    useVariantsStore.setState({
      variants: [makeVariant()],
      variantsLoading: false,
    } as any);

    useInstancesStore.setState({
      instances: {
        local1: makeInstance({
          instance_id: 'local1',
          is_caught: true,
        }),
      },
      foreignInstances: null,
      instancesLoading: false,
    });
  });

  it('does not rebuild local tags when only foreignInstances changes', async () => {
    const sentinelTags = {
      caught: {
        sentinel: {
          instance_id: 'sentinel',
          pokemon_id: 1,
          pokedex_number: 1,
          currentImage: '/images/default/pokemon_1.png',
        },
      },
      wanted: {},
      trade: {},
    } as any;

    useTagsStore.setState({
      tags: sentinelTags,
      foreignTags: null,
    });

    const localRefBefore = useTagsStore.getState().tags;

    act(() => {
      useInstancesStore.setState((state) => ({
        ...state,
        foreignInstances: {
          foreign1: makeInstance({
            instance_id: 'foreign1',
            is_caught: true,
          }),
        },
      }));
    });

    await waitFor(() => {
      expect(useTagsStore.getState().foreignTags?.caught).toHaveProperty('foreign1');
    });

    // Performance regression guard: foreign updates should not rewrite local tags.
    expect(useTagsStore.getState().tags).toBe(localRefBefore);
  });
});

