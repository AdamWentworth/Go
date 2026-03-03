import type { BasePokemon } from '@pokemongonexus/shared-contracts/pokemon';
import {
  createInstanceFromPokemon,
  toDefaultVariantId,
} from '../../../../src/features/instances/createInstanceFromPokemon';

const makePokemon = (overrides?: Partial<BasePokemon>): BasePokemon =>
  ({
    pokemon_id: 25,
    name: 'Pikachu',
    pokedex_number: 25,
    attack: 112,
    defense: 96,
    stamina: 111,
    type_1_id: 13,
    type_2_id: 0,
    gender_rate: '1:1',
    rarity: 'Common',
    form: null,
    generation: 1,
    available: 1,
    shiny_available: 1,
    shiny_rarity: null,
    date_available: '2016-07-06',
    date_shiny_available: '2017-03-22',
    female_unique: 0,
    type1_name: 'Electric',
    type2_name: '',
    shadow_shiny_available: 0,
    shadow_apex: null,
    date_shadow_available: '2019-07-22',
    date_shiny_shadow_available: '2020-01-01',
    shiny_shadow_rarity: null,
    image_url: 'https://example.com/pikachu.png',
    image_url_shadow: 'https://example.com/pikachu-shadow.png',
    image_url_shiny: 'https://example.com/pikachu-shiny.png',
    image_url_shiny_shadow: 'https://example.com/pikachu-shiny-shadow.png',
    type_1_icon: '',
    type_2_icon: '',
    costumes: [],
    moves: [],
    fusion: [],
    backgrounds: [],
    cp40: 938,
    cp50: 1061,
    evolves_to: [],
    evolves_from: [],
    megaEvolutions: [],
    raid_boss: [],
    sizes: {
      pokedex_height: 0.4,
      pokedex_weight: 6.0,
      height_standard_deviation: 0.1,
      weight_standard_deviation: 0.2,
      height_xxs_threshold: 0.2,
      height_xs_threshold: 0.3,
      height_xl_threshold: 0.5,
      height_xxl_threshold: 0.6,
      weight_xxs_threshold: 2.0,
      weight_xs_threshold: 4.0,
      weight_xl_threshold: 8.0,
      weight_xxl_threshold: 10.0,
    },
    max: [],
    sprite_url: null,
    ...overrides,
  }) as BasePokemon;

describe('createInstanceFromPokemon', () => {
  it('builds default variant ids from pokemon id and form', () => {
    expect(toDefaultVariantId(25, null)).toBe('0025-default');
    expect(toDefaultVariantId(6, 'Mega X')).toBe('0006-mega_x_default');
    expect(toDefaultVariantId(150, 'normal')).toBe('0150-default');
  });

  it('creates a caught instance snapshot from pokemon data', () => {
    const instance = createInstanceFromPokemon(makePokemon(), 'caught');

    expect(instance.instance_id).toContain('mobile_');
    expect(instance.variant_id).toBe('0025-default');
    expect(instance.pokemon_id).toBe(25);
    expect(instance.is_caught).toBe(true);
    expect(instance.is_for_trade).toBe(false);
    expect(instance.is_wanted).toBe(false);
    expect(instance.registered).toBe(true);
  });

  it('creates trade and wanted snapshots with normalized ownership flags', () => {
    const tradeInstance = createInstanceFromPokemon(makePokemon(), 'trade');
    expect(tradeInstance.is_caught).toBe(true);
    expect(tradeInstance.is_for_trade).toBe(true);
    expect(tradeInstance.is_wanted).toBe(false);

    const wantedInstance = createInstanceFromPokemon(makePokemon(), 'wanted');
    expect(wantedInstance.is_caught).toBe(false);
    expect(wantedInstance.is_for_trade).toBe(false);
    expect(wantedInstance.is_wanted).toBe(true);
  });
});

