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
    fireEvent.changeText(screen.getByPlaceholderText('Nickname'), 'x'.repeat(13));
    fireEvent.press(screen.getByText('Save Nickname'));

    await waitFor(() => {
      expect(screen.getByText('Nickname must be 12 characters or fewer.')).toBeTruthy();
    });
    expect(mockedSendPokemonUpdate).not.toHaveBeenCalled();
  });

  it('blocks adding duplicate tags in the same bucket', async () => {
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
    fireEvent.changeText(screen.getByPlaceholderText('Tag for caught bucket'), 'pvp');
    fireEvent.press(screen.getByText('Add Caught Tag'));

    await waitFor(() => {
      expect(screen.getByText('Tag already exists in caught bucket.')).toBeTruthy();
    });
    expect(mockedSendPokemonUpdate).not.toHaveBeenCalled();
  });

  it('blocks adding tag when tag exceeds max length', async () => {
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
    fireEvent.changeText(screen.getByPlaceholderText('Tag for caught bucket'), 'x'.repeat(41));
    fireEvent.press(screen.getByText('Add Caught Tag'));

    await waitFor(() => {
      expect(screen.getByText('Tag must be 40 characters or fewer.')).toBeTruthy();
    });
    expect(mockedSendPokemonUpdate).not.toHaveBeenCalled();
  });

  it('saves caught details (gender/date_caught) and syncs update', async () => {
    mockedFetchUserOverview.mockResolvedValue({
      user: { user_id: 'u1', username: 'ash' },
      pokemon_instances: {
        i1: {
          instance_id: 'i1',
          variant_id: 'v-001',
          pokemon_id: 1,
          nickname: null,
          gender: null,
          date_caught: null,
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
    fireEvent.press(screen.getByText('male'));
    fireEvent.changeText(screen.getByPlaceholderText('Date Caught (YYYY-MM-DD)'), '2026-02-22');
    fireEvent.press(screen.getByText('Save Caught Details'));

    await waitFor(() => {
      expect(mockedSendPokemonUpdate).toHaveBeenCalled();
    });
    expect(mockedSendPokemonUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'i1',
        gender: 'male',
        date_caught: '2026-02-22',
      }),
    );
  });

  it('blocks caught details update when date format is invalid', async () => {
    mockedFetchUserOverview.mockResolvedValue({
      user: { user_id: 'u1', username: 'ash' },
      pokemon_instances: {
        i1: {
          instance_id: 'i1',
          variant_id: 'v-001',
          pokemon_id: 1,
          nickname: null,
          gender: null,
          date_caught: null,
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
    fireEvent.changeText(screen.getByPlaceholderText('Date Caught (YYYY-MM-DD)'), '2026-02-31');
    fireEvent.press(screen.getByText('Save Caught Details'));

    await waitFor(() => {
      expect(screen.getByText('Date caught must use YYYY-MM-DD format.')).toBeTruthy();
    });
    expect(mockedSendPokemonUpdate).not.toHaveBeenCalled();
  });

  it('saves CP/level/IV battle stats and syncs update', async () => {
    mockedFetchUserOverview.mockResolvedValue({
      user: { user_id: 'u1', username: 'ash' },
      pokemon_instances: {
        i1: {
          instance_id: 'i1',
          variant_id: 'v-001',
          pokemon_id: 1,
          nickname: null,
          cp: null,
          level: null,
          attack_iv: null,
          defense_iv: null,
          stamina_iv: null,
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
    fireEvent.changeText(screen.getByPlaceholderText('CP'), '2499');
    fireEvent.changeText(screen.getByPlaceholderText('Level'), '40');
    fireEvent.changeText(screen.getByPlaceholderText('Attack IV'), '15');
    fireEvent.changeText(screen.getByPlaceholderText('Defense IV'), '14');
    fireEvent.changeText(screen.getByPlaceholderText('Stamina IV'), '13');
    fireEvent.press(screen.getByText('Save Battle Stats'));

    await waitFor(() => {
      expect(mockedSendPokemonUpdate).toHaveBeenCalled();
    });
    expect(mockedSendPokemonUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'i1',
        cp: 2499,
        level: 40,
        attack_iv: 15,
        defense_iv: 14,
        stamina_iv: 13,
      }),
    );
  });

  it('blocks battle stats update when IV value is out of range', async () => {
    mockedFetchUserOverview.mockResolvedValue({
      user: { user_id: 'u1', username: 'ash' },
      pokemon_instances: {
        i1: {
          instance_id: 'i1',
          variant_id: 'v-001',
          pokemon_id: 1,
          nickname: null,
          cp: null,
          level: null,
          attack_iv: null,
          defense_iv: null,
          stamina_iv: null,
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
    fireEvent.changeText(screen.getByPlaceholderText('Attack IV'), '16');
    fireEvent.press(screen.getByText('Save Battle Stats'));

    await waitFor(() => {
      expect(screen.getByText('Attack IV must be between 0 and 15.')).toBeTruthy();
    });
    expect(mockedSendPokemonUpdate).not.toHaveBeenCalled();
  });

  it('saves move ids and syncs update', async () => {
    mockedFetchUserOverview.mockResolvedValue({
      user: { user_id: 'u1', username: 'ash' },
      pokemon_instances: {
        i1: {
          instance_id: 'i1',
          variant_id: 'v-001',
          pokemon_id: 1,
          nickname: null,
          fast_move_id: null,
          charged_move1_id: null,
          charged_move2_id: null,
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
    fireEvent.changeText(screen.getByPlaceholderText('Fast Move ID'), '216');
    fireEvent.changeText(screen.getByPlaceholderText('Charged Move 1 ID'), '90');
    fireEvent.changeText(screen.getByPlaceholderText('Charged Move 2 ID'), '14');
    fireEvent.press(screen.getByText('Save Moves'));

    await waitFor(() => {
      expect(mockedSendPokemonUpdate).toHaveBeenCalled();
    });
    expect(mockedSendPokemonUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'i1',
        fast_move_id: 216,
        charged_move1_id: 90,
        charged_move2_id: 14,
      }),
    );
  });

  it('blocks move id save when value is negative', async () => {
    mockedFetchUserOverview.mockResolvedValue({
      user: { user_id: 'u1', username: 'ash' },
      pokemon_instances: {
        i1: {
          instance_id: 'i1',
          variant_id: 'v-001',
          pokemon_id: 1,
          nickname: null,
          fast_move_id: null,
          charged_move1_id: null,
          charged_move2_id: null,
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
    fireEvent.changeText(screen.getByPlaceholderText('Fast Move ID'), '-1');
    fireEvent.press(screen.getByText('Save Moves'));

    await waitFor(() => {
      expect(screen.getByText('Fast Move ID must be 0 or greater.')).toBeTruthy();
    });
    expect(mockedSendPokemonUpdate).not.toHaveBeenCalled();
  });

  it('saves aura status with normalized shadow/purified behavior', async () => {
    mockedFetchUserOverview.mockResolvedValue({
      user: { user_id: 'u1', username: 'ash' },
      pokemon_instances: {
        i1: {
          instance_id: 'i1',
          variant_id: 'v-001',
          pokemon_id: 1,
          nickname: null,
          lucky: true,
          shadow: false,
          purified: false,
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
    fireEvent.press(screen.getByText('Set Shadow'));
    fireEvent.press(screen.getByText('Save Aura'));

    await waitFor(() => {
      expect(mockedSendPokemonUpdate).toHaveBeenCalled();
    });
    expect(mockedSendPokemonUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'i1',
        shadow: true,
        purified: false,
        lucky: false,
      }),
    );
  });

  it('blocks location detail save when location text exceeds max length', async () => {
    mockedFetchUserOverview.mockResolvedValue({
      user: { user_id: 'u1', username: 'ash' },
      pokemon_instances: {
        i1: {
          instance_id: 'i1',
          variant_id: 'v-001',
          pokemon_id: 1,
          nickname: null,
          location_caught: null,
          location_card: null,
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
    fireEvent.changeText(screen.getByPlaceholderText('Location Caught'), 'x'.repeat(256));
    fireEvent.press(screen.getByText('Save Location Details'));

    await waitFor(() => {
      expect(screen.getByText('Location caught must be 255 characters or fewer.')).toBeTruthy();
    });
    expect(mockedSendPokemonUpdate).not.toHaveBeenCalled();
  });

  it('saves max stats and syncs update', async () => {
    mockedFetchUserOverview.mockResolvedValue({
      user: { user_id: 'u1', username: 'ash' },
      pokemon_instances: {
        i1: {
          instance_id: 'i1',
          variant_id: 'v-001',
          pokemon_id: 1,
          nickname: null,
          max_attack: null,
          max_guard: null,
          max_spirit: null,
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
    fireEvent.changeText(screen.getByPlaceholderText('Max Attack'), '3');
    fireEvent.changeText(screen.getByPlaceholderText('Max Guard'), '2');
    fireEvent.changeText(screen.getByPlaceholderText('Max Spirit'), '1');
    fireEvent.press(screen.getByText('Save Max Stats'));

    await waitFor(() => {
      expect(mockedSendPokemonUpdate).toHaveBeenCalled();
    });
    expect(mockedSendPokemonUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'i1',
        max_attack: 3,
        max_guard: 2,
        max_spirit: 1,
      }),
    );
  });

  it('blocks max stat save when value exceeds range', async () => {
    mockedFetchUserOverview.mockResolvedValue({
      user: { user_id: 'u1', username: 'ash' },
      pokemon_instances: {
        i1: {
          instance_id: 'i1',
          variant_id: 'v-001',
          pokemon_id: 1,
          nickname: null,
          max_attack: null,
          max_guard: null,
          max_spirit: null,
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
    fireEvent.changeText(screen.getByPlaceholderText('Max Attack'), '4');
    fireEvent.press(screen.getByText('Save Max Stats'));

    await waitFor(() => {
      expect(screen.getByText('Max Attack must be between 0 and 3.')).toBeTruthy();
    });
    expect(mockedSendPokemonUpdate).not.toHaveBeenCalled();
  });

  it('saves physical details and syncs update', async () => {
    mockedFetchUserOverview.mockResolvedValue({
      user: { user_id: 'u1', username: 'ash' },
      pokemon_instances: {
        i1: {
          instance_id: 'i1',
          variant_id: 'v-001',
          pokemon_id: 1,
          nickname: null,
          weight: null,
          height: null,
          costume_id: null,
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
    fireEvent.changeText(screen.getByPlaceholderText('Weight'), '12.5');
    fireEvent.changeText(screen.getByPlaceholderText('Height'), '1.33');
    fireEvent.changeText(screen.getByPlaceholderText('Costume ID'), '55');
    fireEvent.press(screen.getByText('Save Physical Details'));

    await waitFor(() => {
      expect(mockedSendPokemonUpdate).toHaveBeenCalled();
    });
    expect(mockedSendPokemonUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'i1',
        weight: 12.5,
        height: 1.33,
        costume_id: 55,
      }),
    );
  });

  it('blocks physical detail save when weight is invalid', async () => {
    mockedFetchUserOverview.mockResolvedValue({
      user: { user_id: 'u1', username: 'ash' },
      pokemon_instances: {
        i1: {
          instance_id: 'i1',
          variant_id: 'v-001',
          pokemon_id: 1,
          nickname: null,
          weight: null,
          height: null,
          costume_id: null,
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
    fireEvent.changeText(screen.getByPlaceholderText('Weight'), '-1');
    fireEvent.press(screen.getByText('Save Physical Details'));

    await waitFor(() => {
      expect(screen.getByText('Weight must be 0 or greater.')).toBeTruthy();
    });
    expect(mockedSendPokemonUpdate).not.toHaveBeenCalled();
  });
});
