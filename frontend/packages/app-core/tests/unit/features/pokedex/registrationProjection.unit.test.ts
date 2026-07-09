import { describe, expect, it } from 'vitest';

import {
  buildPokedexRegistrationId,
  deriveAppraisalFacet,
  deriveInstanceSizeClass,
  projectCatalogRegistration,
  projectInstanceRegistrations,
  projectPokedexRegistrations,
} from '@/features/pokedex/registrationProjection';

import type { PokemonInstance } from '@/types/pokemonInstance';
import type { PokemonVariant } from '@/types/pokemonVariants';

function makeVariant(overrides: Partial<PokemonVariant> = {}): PokemonVariant {
  return {
    variant_id: '0001-default',
    pokemon_id: 1,
    pokedex_number: 1,
    name: 'Bulbasaur',
    species_name: 'Bulbasaur',
    form: null,
    variantType: 'default',
    currentImage: '/images/default/pokemon_1.png',
    image_url: '/images/default/pokemon_1.png',
    image_url_shiny: '/images/shiny/shiny_pokemon_1.png',
    image_url_shadow: '/images/shadow/shadow_pokemon_1.png',
    image_url_shiny_shadow: '/images/shiny_shadow/shiny_shadow_pokemon_1.png',
    costumes: [],
    moves: [],
    fusion: [],
    backgrounds: [],
    megaEvolutions: [],
    max: [],
    evolves_from: [],
    evolves_to: [],
    sizes: {
      pokedex_height: 0.7,
      pokedex_weight: 6.9,
      height_standard_deviation: 0.1,
      weight_standard_deviation: 1,
      height_xxs_threshold: 0.45,
      height_xs_threshold: 0.6,
      height_xl_threshold: 0.85,
      height_xxl_threshold: 1.05,
      weight_xxs_threshold: 4,
      weight_xs_threshold: 5.5,
      weight_xl_threshold: 8,
      weight_xxl_threshold: 10,
    },
    ...overrides,
  } as PokemonVariant;
}

function makeInstance(overrides: Partial<PokemonInstance> = {}): PokemonInstance {
  return {
    instance_id: 'instance-1',
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
    gender: null,
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
    friendship_level: null,
    registered: false,
    favorite: false,
    disabled: false,
    pokeball: null,
    location_card: null,
    location_caught: null,
    date_caught: null,
    date_added: '2026-01-02T03:04:05.000Z',
    last_update: 12345,
    ...overrides,
  } as PokemonInstance;
}

describe('pokedex registration projection', () => {
  it('builds deterministic IDs with canonical facet ordering', () => {
    expect(
      buildPokedexRegistrationId({
        pokemon_id: 1,
        form: null,
        facets: {
          background: 'GO Fest 2026',
          variant: 'shiny_shadow',
          size: 'xxl',
        },
      }),
    ).toBe('species:1|form:normal|variant:shiny-shadow|size:xxl|background:go-fest-2026');
  });

  it('creates unregistered catalog fallback entries from variants', () => {
    const entry = projectCatalogRegistration(makeVariant({ variantType: 'shiny' }));

    expect(entry.registration_id).toBe('species:1|form:normal|variant:shiny');
    expect(entry.is_registered).toBe(false);
    expect(entry.source).toBe('catalog');
    expect(entry.level).toBe('base');
  });

  it('derives size and appraisal facets from instance details', () => {
    const variant = makeVariant();
    const instance = makeInstance({
      height: 1.2,
      attack_iv: 15,
      defense_iv: 15,
      stamina_iv: 15,
    });

    expect(deriveInstanceSizeClass(variant, instance)).toBe('xxl');
    expect(deriveAppraisalFacet(instance)).toBe('4-star');
  });

  it('projects exact full-combo registrations plus derived coverage entries', () => {
    const variant = makeVariant({
      variant_id: '0001-shiny_shadow',
      variantType: 'shiny_shadow',
      currentImage: '/images/shiny_shadow/shiny_shadow_pokemon_1.png',
    });
    const instance = makeInstance({
      variant_id: '0001-shiny_shadow',
      is_caught: true,
      height: 1.2,
      location_card: 'GO Fest 2026',
      lucky: true,
      purified: true,
      gender: 'Female',
      attack_iv: 15,
      defense_iv: 15,
      stamina_iv: 15,
      pokeball: 'Ultra Ball',
      date_caught: '2026-07-08T00:00:00.000Z',
    });

    const entries = projectInstanceRegistrations(variant, instance);
    const byId = new Map(entries.map((entry) => [entry.registration_id, entry]));
    const baseId = 'species:1|form:normal|variant:shiny-shadow';
    const sizeId = `${baseId}|size:xxl`;
    const exactId = [
      baseId,
      'size:xxl',
      'background:go-fest-2026',
      'lucky:true',
      'purified:true',
      'gender:female',
      'appraisal:4-star',
      'ball:ultra-ball',
    ].join('|');

    expect(byId.get(baseId)?.is_registered).toBe(true);
    expect(byId.get(sizeId)?.level).toBe('derived');
    expect(byId.get(exactId)).toMatchObject({
      is_registered: true,
      registered_at: '2026-07-08T00:00:00.000Z',
      source: 'instance',
      source_instance_id: 'instance-1',
      level: 'exact',
    });
  });

  it('does not count wishlist-only instances as registrations', () => {
    const entries = projectInstanceRegistrations(
      makeVariant(),
      makeInstance({ is_wanted: true, is_caught: false, is_for_trade: false, registered: false }),
    );

    expect(entries).toEqual([]);
  });

  it('merges instance registrations over catalog fallback entries', () => {
    const variant = makeVariant();
    const entries = projectPokedexRegistrations(
      [variant],
      {
        'instance-1': makeInstance({
          instance_id: 'instance-1',
          is_for_trade: true,
          registered: false,
          attack_iv: null,
          defense_iv: null,
          stamina_iv: null,
        }),
      },
    );

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      registration_id: 'species:1|form:normal|variant:default',
      is_registered: true,
      source: 'instance',
      source_instance_id: 'instance-1',
      level: 'exact',
    });
  });
});
