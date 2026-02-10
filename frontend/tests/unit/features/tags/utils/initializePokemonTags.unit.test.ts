import { beforeEach, describe, expect, it, vi } from 'vitest';

const determineImageUrlMock = vi.hoisted(() => vi.fn(() => '/images/override.png'));

vi.mock('@/utils/imageHelpers', () => ({
  determineImageUrl: determineImageUrlMock,
}));

import { initializePokemonTags } from '@/features/tags/utils/initializePokemonTags';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { PokemonInstance } from '@/types/pokemonInstance';

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

describe('initializePokemonTags', () => {
  beforeEach(() => {
    determineImageUrlMock.mockClear();
  });

  it('returns canonical empty buckets', () => {
    const out = initializePokemonTags({}, []);
    expect(out).toEqual({ caught: {}, wanted: {} });
  });

  it('maps instances into caught and wanted buckets', () => {
    const variants = [
      makeVariant({ variant_id: '0001-default', pokemon_id: 1 }),
      makeVariant({ variant_id: '0004-default', pokemon_id: 4, name: 'Charmander', pokedex_number: 4 }),
    ];

    const instances = {
      'caught-1': makeInstance({
        instance_id: 'caught-1',
        variant_id: '0001-default',
        pokemon_id: 1,
        is_caught: true,
      }),
      'wanted-1': makeInstance({
        instance_id: 'wanted-1',
        variant_id: '0004-default',
        pokemon_id: 4,
        is_wanted: true,
      }),
    };

    const out = initializePokemonTags(instances, variants);
    expect(out.caught).toHaveProperty('caught-1');
    expect(out.wanted).toHaveProperty('wanted-1');
  });

  it('allows a single instance to exist in both caught and wanted', () => {
    const instanceId = 'dual-1';
    const out = initializePokemonTags(
      {
        [instanceId]: makeInstance({
          instance_id: instanceId,
          is_caught: true,
          is_wanted: true,
        }),
      },
      [makeVariant()]
    );

    expect(out.caught).toHaveProperty(instanceId);
    expect(out.wanted).toHaveProperty(instanceId);
  });

  it('falls back to pokemon_id+shiny lookup when variant_id is missing', () => {
    const variant = makeVariant({
      variant_id: '0001-shiny',
      variantType: 'shiny',
      pokemon_id: 1,
      currentImage: '/images/shiny/shiny_pokemon_1.png',
    });
    const instanceId = 'fallback-1';

    const out = initializePokemonTags(
      {
        [instanceId]: makeInstance({
          instance_id: instanceId,
          variant_id: '' as unknown as string,
          pokemon_id: 1,
          shiny: true,
          is_caught: true,
        }),
      },
      [variant]
    );

    expect(out.caught).toHaveProperty(instanceId);
    expect(out.caught[instanceId].currentImage).toBe('/images/shiny/shiny_pokemon_1.png');
  });

  it('ignores instances when no matching variant can be resolved', () => {
    const out = initializePokemonTags(
      {
        ghost: makeInstance({
          instance_id: 'ghost',
          variant_id: '9999-default',
          pokemon_id: 9999,
          is_caught: true,
          is_wanted: true,
        }),
      },
      [makeVariant()]
    );

    expect(out.caught.ghost).toBeUndefined();
    expect(out.wanted.ghost).toBeUndefined();
  });

  it('uses image override helper for female/mega/fusion/purified cases', () => {
    const variant = makeVariant({
      female_data: { female_available: true } as any,
      megaEvolutions: [{ key: 'mega' }] as any,
      fusion: [{ key: 'fusion' }] as any,
      currentImage: '/images/default/pokemon_1.png',
    } as any);

    const out = initializePokemonTags(
      {
        special: makeInstance({
          instance_id: 'special',
          is_caught: true,
          gender: 'Female',
          is_mega: true,
          is_fused: true,
          purified: true,
        }),
      },
      [variant]
    );

    expect(determineImageUrlMock).toHaveBeenCalledTimes(1);
    expect(out.caught.special.currentImage).toBe('/images/override.png');
  });

  it('falls back to default image when variant image is missing', () => {
    const out = initializePokemonTags(
      {
        fallbackImage: makeInstance({
          instance_id: 'fallbackImage',
          is_caught: true,
        }),
      },
      [makeVariant({ currentImage: undefined as unknown as string })]
    );

    expect(out.caught.fallbackImage.currentImage).toBe('/images/default_pokemon.png');
  });
});
