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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('runs search and renders result count', async () => {
    mockedSearchPokemon.mockResolvedValue([{ pokemon_id: 25, distance: 1.5 }]);

    render(<SearchScreen navigation={baseNavigation as never} route={route as never} />);

    fireEvent.changeText(screen.getByPlaceholderText('Pokemon ID'), '25');
    fireEvent.press(screen.getAllByText('Search')[1] as never);

    await waitFor(() => {
      expect(mockedSearchPokemon).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByText('Results: 1')).toBeTruthy();
  });
});
