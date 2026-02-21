import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { PokemonCatalogScreen } from '../../../src/screens/PokemonCatalogScreen';
import { fetchPokemons } from '../../../src/services/pokemonService';

jest.mock('../../../src/services/pokemonService', () => ({
  fetchPokemons: jest.fn(),
}));

const mockedFetchPokemons = fetchPokemons as jest.MockedFunction<typeof fetchPokemons>;

const baseNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
};

const route = {
  key: 'PokemonCatalog-key',
  name: 'PokemonCatalog',
  params: undefined,
} as const;

const renderScreen = () =>
  render(
    <PokemonCatalogScreen
      navigation={baseNavigation as never}
      route={route as never}
    />,
  );

describe('PokemonCatalogScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads pokemon list and shows selected detail', async () => {
    mockedFetchPokemons.mockResolvedValue([
      {
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
      },
    ] as never);

    renderScreen();

    await waitFor(() => {
      expect(mockedFetchPokemons).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByText('#25 Pikachu')).toBeTruthy();

    fireEvent.press(screen.getByText('#25 Pikachu'));
    expect(screen.getByText('Pokedex #25')).toBeTruthy();
    expect(screen.getByText('Stats: ATK 112 DEF 96 STA 111')).toBeTruthy();
  });

  it('shows empty filtered state when there is no match', async () => {
    mockedFetchPokemons.mockResolvedValue([
      {
        pokemon_id: 4,
        name: 'Charmander',
        pokedex_number: 4,
        attack: 116,
        defense: 93,
        stamina: 118,
        type_1_id: 10,
        type_2_id: 0,
        gender_rate: '1:1',
        rarity: 'Common',
        form: null,
        generation: 1,
        available: 1,
        shiny_available: 1,
        shiny_rarity: null,
        date_available: '2016-07-06',
        date_shiny_available: '2018-01-01',
        female_unique: 0,
        type1_name: 'Fire',
        type2_name: '',
        shadow_shiny_available: 0,
        shadow_apex: null,
        date_shadow_available: '2019-01-01',
        date_shiny_shadow_available: '2020-01-01',
        shiny_shadow_rarity: null,
        image_url: 'https://example.com/charmander.png',
        image_url_shadow: 'https://example.com/charmander-shadow.png',
        image_url_shiny: 'https://example.com/charmander-shiny.png',
        image_url_shiny_shadow: 'https://example.com/charmander-shiny-shadow.png',
        type_1_icon: '',
        type_2_icon: '',
        costumes: [],
        moves: [],
        fusion: [],
        backgrounds: [],
        cp40: 980,
        cp50: 1113,
        evolves_to: [],
        evolves_from: [],
        megaEvolutions: [],
        raid_boss: [],
        sizes: {
          pokedex_height: 0.6,
          pokedex_weight: 8.5,
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
      },
    ] as never);

    renderScreen();

    await waitFor(() => {
      expect(mockedFetchPokemons).toHaveBeenCalledTimes(1);
    });

    fireEvent.changeText(screen.getByPlaceholderText('Filter by name...'), 'zzz');
    expect(screen.getByText('No pokemon matched your filter.')).toBeTruthy();
  });
});
