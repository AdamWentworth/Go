import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { TrainerSearchScreen } from '../../../src/screens/TrainerSearchScreen';
import {
  fetchForeignInstancesByUsername,
  fetchTrainerAutocomplete,
} from '../../../src/services/userSearchService';

jest.mock('../../../src/services/userSearchService', () => ({
  fetchTrainerAutocomplete: jest.fn(),
  fetchForeignInstancesByUsername: jest.fn(),
}));

const mockedAutocomplete = fetchTrainerAutocomplete as jest.MockedFunction<
  typeof fetchTrainerAutocomplete
>;
const mockedLookup = fetchForeignInstancesByUsername as jest.MockedFunction<
  typeof fetchForeignInstancesByUsername
>;

const baseNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
};

const route = {
  key: 'TrainerSearch-key',
  name: 'TrainerSearch',
  params: undefined,
} as const;

const renderScreen = () =>
  render(
    <TrainerSearchScreen
      navigation={baseNavigation as never}
      route={route as never}
    />,
  );

describe('TrainerSearchScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads autocomplete results, performs lookup, and filters by ownership mode', async () => {
    mockedAutocomplete.mockResolvedValue({
      type: 'success',
      results: [{ username: 'ash', pokemonGoName: 'Ash Ketchum' }],
    });
    mockedLookup.mockResolvedValue({
      type: 'success',
      username: 'ash',
      instances: {
        i1: { variant_id: 'v-001', is_caught: true, is_for_trade: false, is_wanted: false },
        i2: { variant_id: 'v-002', is_caught: false, is_for_trade: true, is_wanted: true },
      } as never,
      etag: null,
    });

    renderScreen();

    fireEvent.changeText(screen.getByPlaceholderText('Search trainer username...'), 'ash');

    await waitFor(() => {
      expect(mockedAutocomplete).toHaveBeenCalledWith('ash');
    });

    fireEvent.press(screen.getByText('ash'));
    fireEvent.press(screen.getByText('Lookup Trainer'));

    await waitFor(() => {
      expect(mockedLookup).toHaveBeenCalledWith('ash');
    });

    expect(screen.getByText('Total instances: 2')).toBeTruthy();
    expect(screen.getByText('Showing 1 of 1 matched instances.')).toBeTruthy();
    expect(screen.getByText('v-001')).toBeTruthy();

    fireEvent.press(screen.getByText('trade'));
    expect(screen.getByText('v-002')).toBeTruthy();
  });

  it('shows empty autocomplete state when no trainers match', async () => {
    mockedAutocomplete.mockResolvedValue({
      type: 'success',
      results: [],
    });

    renderScreen();

    fireEvent.changeText(screen.getByPlaceholderText('Search trainer username...'), 'zz');

    await waitFor(() => {
      expect(mockedAutocomplete).toHaveBeenCalledWith('zz');
    });

    expect(screen.getByText('No trainers matched your query.')).toBeTruthy();
  });
});
