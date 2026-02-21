import type { BasePokemon } from '@pokemongonexus/shared-contracts/pokemon';
import {
  findPokemonById,
  toPokemonDetail,
  toPokemonList,
} from '../../../../src/features/pokemon/pokemonReadModels';

const basePokemonFixture = (overrides: Partial<BasePokemon> = {}): BasePokemon => ({
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
  moves: [
    {
      move_id: 1,
      name: 'Quick Attack',
      type_id: 1,
      raid_power: 0,
      pvp_power: 0,
      raid_energy: 0,
      pvp_energy: 0,
      raid_cooldown: 0,
      pvp_turns: 0,
      is_fast: 1,
      type_name: 'Normal',
      legacy: false,
      type: 'Normal',
    },
    {
      move_id: 2,
      name: 'Thunderbolt',
      type_id: 13,
      raid_power: 0,
      pvp_power: 0,
      raid_energy: 0,
      pvp_energy: 0,
      raid_cooldown: 0,
      pvp_turns: 0,
      is_fast: 0,
      type_name: 'Electric',
      legacy: false,
      type: 'Electric',
    },
  ],
  fusion: [],
  backgrounds: [],
  cp40: 938,
  cp50: 1061,
  evolves_to: [26],
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
});

describe('pokemonReadModels', () => {
  it('builds sorted pokemon list items', () => {
    const list = toPokemonList([
      basePokemonFixture({ pokemon_id: 26, name: 'Raichu', pokedex_number: 26 }),
      basePokemonFixture({ pokemon_id: 25, name: 'Pikachu', pokedex_number: 25 }),
    ]);

    expect(list[0]?.pokemonId).toBe(25);
    expect(list[1]?.pokemonId).toBe(26);
    expect(list[0]?.types).toEqual(['Electric']);
  });

  it('builds pokemon detail model including move splits', () => {
    const detail = toPokemonDetail(basePokemonFixture());
    expect(detail.displayName).toBe('Pikachu');
    expect(detail.fastMoves).toEqual(['Quick Attack']);
    expect(detail.chargedMoves).toEqual(['Thunderbolt']);
    expect(detail.shinyAvailable).toBe(true);
  });

  it('finds pokemon by id and returns null for missing id', () => {
    const pokemons = [basePokemonFixture(), basePokemonFixture({ pokemon_id: 26, name: 'Raichu' })];

    expect(findPokemonById(pokemons, 26)?.name).toBe('Raichu');
    expect(findPokemonById(pokemons, 999)).toBeNull();
  });
});
