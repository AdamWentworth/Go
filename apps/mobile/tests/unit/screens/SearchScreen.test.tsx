import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SearchScreen } from '../../../src/screens/SearchScreen';
import { searchPokemon } from '../../../src/services/searchService';

jest.mock('../../../src/services/searchService', () => ({
  searchPokemon: jest.fn(),
}));

const mockedSearchPokemon = searchPokemon as jest.MockedFunction<typeof searchPokemon>;

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
    mockedSearchPokemon.mockResolvedValue([
      { pokemon_id: 25, distance: 1.5, username: 'misty' },
    ]);

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

    fireEvent.press(screen.getByText('username↑'));
    fireEvent.press(screen.getAllByText('pokemon_id: 2')[0] as never);
    expect(screen.getByText('username: alpha')).toBeTruthy();
  });
});
