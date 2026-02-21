import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { PokemonCollectionScreen } from '../../../src/screens/PokemonCollectionScreen';
import { fetchUserOverview } from '../../../src/services/userOverviewService';
import { fetchForeignInstancesByUsername } from '../../../src/services/userSearchService';

jest.mock('../../../src/features/auth/AuthProvider', () => ({
  useAuth: () => ({
    user: { user_id: 'u1', username: 'ash' },
  }),
}));

jest.mock('../../../src/services/userOverviewService', () => ({
  fetchUserOverview: jest.fn(),
}));

jest.mock('../../../src/services/userSearchService', () => ({
  fetchForeignInstancesByUsername: jest.fn(),
  fetchTrainerAutocomplete: jest.fn(),
}));

const mockedFetchUserOverview = fetchUserOverview as jest.MockedFunction<typeof fetchUserOverview>;
const mockedFetchForeignInstancesByUsername =
  fetchForeignInstancesByUsername as jest.MockedFunction<typeof fetchForeignInstancesByUsername>;

const baseNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
};

const route = {
  key: 'PokemonCollection-key',
  name: 'PokemonCollection',
  params: undefined,
} as const;

describe('PokemonCollectionScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads own collection when username is blank', async () => {
    mockedFetchUserOverview.mockResolvedValue({
      user: { user_id: 'u1', username: 'ash' },
      pokemon_instances: {
        i1: { variant_id: 'v-001', is_caught: true, is_for_trade: false, is_wanted: false },
      },
      trades: {},
      related_instances: {},
      registrations: {},
    } as never);

    render(
      <PokemonCollectionScreen navigation={baseNavigation as never} route={route as never} />,
    );

    fireEvent.press(screen.getByText('Load Collection'));

    await waitFor(() => {
      expect(mockedFetchUserOverview).toHaveBeenCalledWith('u1');
    });

    expect(screen.getByText('Active trainer: ash')).toBeTruthy();
    expect(screen.getByText('v-001')).toBeTruthy();
  });

  it('loads foreign collection when username is provided', async () => {
    mockedFetchForeignInstancesByUsername.mockResolvedValue({
      type: 'success',
      username: 'misty',
      instances: {
        i2: { variant_id: 'v-002', is_caught: false, is_for_trade: true, is_wanted: true },
      } as never,
      etag: null,
    });

    render(
      <PokemonCollectionScreen
        navigation={baseNavigation as never}
        route={{ ...route, params: { username: 'misty' } } as never}
      />,
    );

    fireEvent.press(screen.getByText('Load Collection'));

    await waitFor(() => {
      expect(mockedFetchForeignInstancesByUsername).toHaveBeenCalledWith('misty');
    });

    expect(screen.getByText('Active trainer: misty')).toBeTruthy();
    fireEvent.press(screen.getByText('trade'));
    expect(screen.getByText('v-002')).toBeTruthy();
  });
});
