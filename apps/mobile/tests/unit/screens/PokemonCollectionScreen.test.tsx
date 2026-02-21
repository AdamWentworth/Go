import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { PokemonCollectionScreen } from '../../../src/screens/PokemonCollectionScreen';
import { sendPokemonUpdate } from '../../../src/services/receiverService';
import { fetchUserOverview } from '../../../src/services/userOverviewService';
import { fetchForeignInstancesByUsername } from '../../../src/services/userSearchService';
import type { AlertButton } from 'react-native';

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

jest.mock('../../../src/services/receiverService', () => ({
  sendPokemonUpdate: jest.fn(),
}));

const mockedFetchUserOverview = fetchUserOverview as jest.MockedFunction<typeof fetchUserOverview>;
const mockedFetchForeignInstancesByUsername =
  fetchForeignInstancesByUsername as jest.MockedFunction<typeof fetchForeignInstancesByUsername>;
const mockedSendPokemonUpdate = sendPokemonUpdate as jest.MockedFunction<typeof sendPokemonUpdate>;

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
  const mockAlert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

  const confirmLastAlert = async () => {
    const calls = mockAlert.mock.calls;
    const lastCall = calls[calls.length - 1];
    const buttons = (lastCall?.[2] ?? []) as AlertButton[];
    const confirmAction = buttons.find((button) => button.text === 'Confirm');
    await act(async () => {
      confirmAction?.onPress?.();
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads own collection when username is blank', async () => {
    mockedFetchUserOverview.mockResolvedValue({
      user: { user_id: 'u1', username: 'ash' },
      pokemon_instances: {
        i1: {
          instance_id: 'i1',
          variant_id: 'v-001',
          pokemon_id: 1,
          nickname: null,
          is_caught: true,
          is_for_trade: false,
          is_wanted: false,
          most_wanted: false,
          favorite: false,
          registered: true,
          date_added: '2026-01-01T00:00:00Z',
          last_update: 1,
        },
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

  it('allows instance status mutation for own collection and syncs via receiver', async () => {
    mockedFetchUserOverview.mockResolvedValue({
      user: { user_id: 'u1', username: 'ash' },
      pokemon_instances: {
        i1: {
          instance_id: 'i1',
          variant_id: 'v-001',
          pokemon_id: 1,
          nickname: null,
          is_caught: true,
          is_for_trade: false,
          is_wanted: false,
          most_wanted: false,
          favorite: false,
          registered: true,
          date_added: '2026-01-01T00:00:00Z',
          last_update: 1,
        },
      },
      trades: {},
      related_instances: {},
      registrations: {},
    } as never);
    mockedSendPokemonUpdate.mockResolvedValue({});

    render(
      <PokemonCollectionScreen navigation={baseNavigation as never} route={route as never} />,
    );

    fireEvent.press(screen.getByText('Load Collection'));
    await waitFor(() => {
      expect(screen.getByText('v-001')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('v-001'));
    fireEvent.press(screen.getByText('Set Trade'));
    await confirmLastAlert();

    await waitFor(() => {
      expect(mockedSendPokemonUpdate).toHaveBeenCalled();
    });
    expect(mockedSendPokemonUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'i1',
        is_caught: true,
        is_for_trade: true,
        is_wanted: false,
      }),
    );
  });

  it('adds then removes a caught tag for selected own instance', async () => {
    mockedFetchUserOverview.mockResolvedValue({
      user: { user_id: 'u1', username: 'ash' },
      pokemon_instances: {
        i1: {
          instance_id: 'i1',
          variant_id: 'v-001',
          pokemon_id: 1,
          nickname: null,
          is_caught: true,
          is_for_trade: false,
          is_wanted: false,
          most_wanted: false,
          favorite: false,
          caught_tags: [],
          trade_tags: [],
          wanted_tags: [],
          registered: true,
          date_added: '2026-01-01T00:00:00Z',
          last_update: 1,
        },
      },
      trades: {},
      related_instances: {},
      registrations: {},
    } as never);
    mockedSendPokemonUpdate.mockResolvedValue({});

    render(
      <PokemonCollectionScreen navigation={baseNavigation as never} route={route as never} />,
    );

    fireEvent.press(screen.getByText('Load Collection'));
    await waitFor(() => {
      expect(screen.getByText('v-001')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('v-001'));
    fireEvent.press(screen.getByText('tags'));
    fireEvent.changeText(screen.getByPlaceholderText('Tag for caught bucket'), 'PVP');
    fireEvent.press(screen.getByText('Add Caught Tag'));

    await waitFor(() => {
      expect(screen.getByText('Remove Caught tag: PVP')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Remove Caught tag: PVP'));
    await confirmLastAlert();
    await waitFor(() => {
      expect(screen.queryByText('Remove Caught tag: PVP')).toBeNull();
    });

    expect(mockedSendPokemonUpdate).toHaveBeenCalledTimes(2);
  });

  it('clears selected tag bucket after confirmation', async () => {
    mockedFetchUserOverview.mockResolvedValue({
      user: { user_id: 'u1', username: 'ash' },
      pokemon_instances: {
        i1: {
          instance_id: 'i1',
          variant_id: 'v-001',
          pokemon_id: 1,
          nickname: null,
          is_caught: true,
          is_for_trade: false,
          is_wanted: false,
          most_wanted: false,
          favorite: false,
          caught_tags: ['PVP'],
          trade_tags: [],
          wanted_tags: [],
          registered: true,
          date_added: '2026-01-01T00:00:00Z',
          last_update: 1,
        },
      },
      trades: {},
      related_instances: {},
      registrations: {},
    } as never);
    mockedSendPokemonUpdate.mockResolvedValue({});

    render(
      <PokemonCollectionScreen navigation={baseNavigation as never} route={route as never} />,
    );
    fireEvent.press(screen.getByText('Load Collection'));
    await waitFor(() => {
      expect(screen.getByText('v-001')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('v-001'));
    fireEvent.press(screen.getByText('tags'));
    fireEvent.press(screen.getByText('Clear Caught Tags'));
    await confirmLastAlert();

    await waitFor(() => {
      expect(screen.getByText('No tags in caught bucket.')).toBeTruthy();
    });
    expect(mockedSendPokemonUpdate).toHaveBeenCalledTimes(1);
  });

  it('blocks enabling mega when mega form is missing', async () => {
    mockedFetchUserOverview.mockResolvedValue({
      user: { user_id: 'u1', username: 'ash' },
      pokemon_instances: {
        i1: {
          instance_id: 'i1',
          variant_id: 'v-001',
          pokemon_id: 1,
          nickname: null,
          is_caught: true,
          is_for_trade: false,
          is_wanted: false,
          most_wanted: false,
          favorite: false,
          mega: false,
          is_mega: false,
          mega_form: null,
          is_fused: false,
          fusion_form: null,
          registered: true,
          date_added: '2026-01-01T00:00:00Z',
          last_update: 1,
        },
      },
      trades: {},
      related_instances: {},
      registrations: {},
    } as never);
    mockedSendPokemonUpdate.mockResolvedValue({});

    render(
      <PokemonCollectionScreen navigation={baseNavigation as never} route={route as never} />,
    );
    fireEvent.press(screen.getByText('Load Collection'));
    await waitFor(() => {
      expect(screen.getByText('v-001')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('v-001'));
    fireEvent.press(screen.getByText('attributes'));
    fireEvent.changeText(screen.getByPlaceholderText('Mega Form'), '');
    fireEvent.press(screen.getByText('Enable Mega'));

    await waitFor(() => {
      expect(screen.getByText('Mega form is required when enabling mega.')).toBeTruthy();
    });
    expect(mockedSendPokemonUpdate).not.toHaveBeenCalled();
  });

  it('blocks nickname update when nickname exceeds max length', async () => {
    mockedFetchUserOverview.mockResolvedValue({
      user: { user_id: 'u1', username: 'ash' },
      pokemon_instances: {
        i1: {
          instance_id: 'i1',
          variant_id: 'v-001',
          pokemon_id: 1,
          nickname: null,
          is_caught: true,
          is_for_trade: false,
          is_wanted: false,
          most_wanted: false,
          favorite: false,
          registered: true,
          date_added: '2026-01-01T00:00:00Z',
          last_update: 1,
        },
      },
      trades: {},
      related_instances: {},
      registrations: {},
    } as never);
    mockedSendPokemonUpdate.mockResolvedValue({});

    render(
      <PokemonCollectionScreen navigation={baseNavigation as never} route={route as never} />,
    );
    fireEvent.press(screen.getByText('Load Collection'));
    await waitFor(() => {
      expect(screen.getByText('v-001')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('v-001'));
    fireEvent.press(screen.getByText('attributes'));
    fireEvent.changeText(screen.getByPlaceholderText('Nickname'), 'x'.repeat(51));
    fireEvent.press(screen.getByText('Save Nickname'));

    await waitFor(() => {
      expect(screen.getByText('Nickname must be 50 characters or fewer.')).toBeTruthy();
    });
    expect(mockedSendPokemonUpdate).not.toHaveBeenCalled();
  });
});
