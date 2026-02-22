import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SearchScreen } from '../../../src/screens/SearchScreen';
import { searchPokemon } from '../../../src/services/searchService';
import { fetchLocationSuggestions } from '../../../src/services/locationService';

jest.mock('../../../src/services/searchService', () => ({
  searchPokemon: jest.fn(),
}));

jest.mock('../../../src/services/locationService', () => ({
  fetchLocationSuggestions: jest.fn(),
  MIN_LOCATION_QUERY_LENGTH: 3,
}));

const mockedSearchPokemon = searchPokemon as jest.MockedFunction<typeof searchPokemon>;
const mockedFetchLocationSuggestions = fetchLocationSuggestions as jest.MockedFunction<
  typeof fetchLocationSuggestions
>;

const baseNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
};

const route = {
  key: 'Search-key',
  name: 'Search',
  params: undefined,
} as const;

describe('SearchScreen', () => {
  const pressSearchButton = () => {
    const labels = screen.getAllByText('Search');
    fireEvent.press(labels[labels.length - 1] as never);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('runs search and renders result count', async () => {
    mockedSearchPokemon.mockResolvedValue([{ pokemon_id: 25, distance: 1.5, username: 'misty' }]);

    render(<SearchScreen navigation={baseNavigation as never} route={route as never} />);

    fireEvent.changeText(screen.getByPlaceholderText('Pokemon ID'), '25');
    fireEvent.press(screen.getAllByText('Yes')[0] as never);
    pressSearchButton();

    await waitFor(() => {
      expect(mockedSearchPokemon).toHaveBeenCalledTimes(1);
    });
    expect(mockedSearchPokemon).toHaveBeenCalledWith(
      expect.objectContaining({
        pokemon_id: 25,
        shiny: true,
      }),
    );
    expect(screen.getByText('Results: 1')).toBeTruthy();
    fireEvent.press(screen.getAllByText('pokemon_id: 25')[0] as never);
    expect(screen.getByText('Selected Result')).toBeTruthy();
    expect(screen.getByText('Open Trainer Collection')).toBeTruthy();
    fireEvent.press(screen.getByText('Open Trainer Collection'));
    expect(baseNavigation.navigate).toHaveBeenCalledWith('PokemonCollection', { username: 'misty' });
  });

  it('shows no-results hint after a completed empty search', async () => {
    mockedSearchPokemon.mockResolvedValue([]);

    render(<SearchScreen navigation={baseNavigation as never} route={route as never} />);
    pressSearchButton();

    await waitFor(() => {
      expect(screen.getByText('Results: 0')).toBeTruthy();
    });
    expect(
      screen.getByText(
        'No matches found. Try increasing range, relaxing filters, or switching ownership mode.',
      ),
    ).toBeTruthy();
  });

  it('paginates long result sets with load-more', async () => {
    mockedSearchPokemon.mockResolvedValue(
      Array.from({ length: 30 }, (_, index) => ({
        pokemon_id: index + 1,
        distance: index + 0.1,
      })),
    );

    render(<SearchScreen navigation={baseNavigation as never} route={route as never} />);
    pressSearchButton();

    await waitFor(() => {
      expect(screen.getByText('Results: 30')).toBeTruthy();
    });
    expect(screen.getByText('Load More (5 remaining)')).toBeTruthy();

    fireEvent.press(screen.getByText('Load More (5 remaining)'));
    expect(screen.queryByText('Load More (5 remaining)')).toBeNull();
  });

  it('supports sorting by username', async () => {
    mockedSearchPokemon.mockResolvedValue([
      { pokemon_id: 3, distance: 5, username: 'zeta' },
      { pokemon_id: 2, distance: 3, username: 'alpha' },
    ]);

    render(<SearchScreen navigation={baseNavigation as never} route={route as never} />);
    pressSearchButton();

    await waitFor(() => {
      expect(screen.getByText('Results: 2')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('username asc'));
    fireEvent.press(screen.getAllByText('pokemon_id: 2')[0] as never);
    expect(screen.getByText('username: alpha')).toBeTruthy();
  });

  it('syncs map marker selection with selected result details', async () => {
    mockedSearchPokemon.mockResolvedValue([
      { pokemon_id: 10, distance: 1, username: 'ash', latitude: 48.85, longitude: 2.35 },
      { pokemon_id: 11, distance: 2, username: 'brock', latitude: 51.5, longitude: -0.12 },
    ]);

    render(<SearchScreen navigation={baseNavigation as never} route={route as never} />);
    pressSearchButton();

    await waitFor(() => {
      expect(screen.getByText('Results: 2')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('map'));
    expect(screen.getByText('Map Preview')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Map marker #2'));
    expect(screen.getByText('Selected Result')).toBeTruthy();
    expect(screen.getByText('username: brock')).toBeTruthy();
  });

  it('shows location suggestions after debounce and populates lat/lon on selection', async () => {
    jest.useFakeTimers();
    try {
      mockedFetchLocationSuggestions.mockResolvedValue([
        { displayName: 'Paris, France', latitude: 48.8566, longitude: 2.3522 },
      ]);

      render(<SearchScreen navigation={baseNavigation as never} route={route as never} />);

      fireEvent.changeText(screen.getByPlaceholderText('Location name (city, region...)'), 'Par');

      await act(async () => {
        jest.runAllTimers();
      });

      await waitFor(() => {
        expect(mockedFetchLocationSuggestions).toHaveBeenCalledWith('Par');
      });

      await waitFor(() => {
        expect(screen.getByText('Paris, France')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Paris, France'));

      expect(screen.getByPlaceholderText('Latitude').props.value).toBe('48.8566');
      expect(screen.getByPlaceholderText('Longitude').props.value).toBe('2.3522');
      expect(screen.queryByText('Paris, France')).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  it('does not call location service for short queries', async () => {
    jest.useFakeTimers();
    try {
      render(<SearchScreen navigation={baseNavigation as never} route={route as never} />);

      fireEvent.changeText(screen.getByPlaceholderText('Location name (city, region...)'), 'ab');

      await act(async () => {
        jest.runAllTimers();
      });

      expect(mockedFetchLocationSuggestions).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });

  it('shows viewport filter controls and filtered count in map view', async () => {
    mockedSearchPokemon.mockResolvedValue([
      { pokemon_id: 1, distance: 1, username: 'ash', latitude: 1, longitude: 1 },
      { pokemon_id: 2, distance: 2, username: 'brock', latitude: 50, longitude: 50 },
    ]);

    render(<SearchScreen navigation={baseNavigation as never} route={route as never} />);
    pressSearchButton();

    await waitFor(() => {
      expect(screen.getByText('Results: 2')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('map'));
    expect(screen.getByText('Viewport filter')).toBeTruthy();
    expect(screen.getByText('Map points: 2')).toBeTruthy();

    fireEvent.press(screen.getByText('+'));
    fireEvent.press(screen.getByText('+'));
    fireEvent.press(screen.getByText('On'));

    await waitFor(() => {
      expect(screen.getByText(/Map points:/)).toBeTruthy();
    });
  });

  it('resets location query when Reset Filters is pressed', async () => {
    mockedFetchLocationSuggestions.mockResolvedValue([]);

    render(<SearchScreen navigation={baseNavigation as never} route={route as never} />);

    fireEvent.changeText(screen.getByPlaceholderText('Location name (city, region...)'), 'London');
    fireEvent.press(screen.getByText('Reset Filters'));

    expect(screen.getByPlaceholderText('Location name (city, region...)').props.value).toBe('');
  });
});
