import { act } from '@testing-library/react';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { useAuthStore } from '@/stores/useAuthStore';

import type { PokemonInstance } from '@/types/pokemonInstance';

import { enableLogging, testLogger } from '../setupTests';

function makeInstance(overrides: Partial<PokemonInstance> = {}): PokemonInstance {
  return {
    instance_id: 'inst-1',
    variant_id: '0001-default',
    pokemon_id: 1,
    nickname: null,
    cp: null,
    level: null,
    attack_iv: null,
    defense_iv: null,
    stamina_iv: null,
    shiny: false,
    costume_id: null,
    lucky: false,
    shadow: false,
    purified: false,
    fast_move_id: null,
    charged_move1_id: null,
    charged_move2_id: null,
    weight: null,
    height: null,
    gender: null,
    mega: false,
    mega_form: null,
    is_mega: false,
    dynamax: false,
    gigantamax: false,
    crown: false,
    max_attack: null,
    max_guard: null,
    max_spirit: null,
    is_fused: false,
    fusion: null,
    fusion_form: null,
    fused_with: null,
    is_traded: false,
    traded_date: null,
    original_trainer_id: null,
    original_trainer_name: null,
    is_caught: true,
    is_for_trade: false,
    is_wanted: false,
    most_wanted: false,
    caught_tags: [],
    trade_tags: [],
    wanted_tags: [],
    not_trade_list: {},
    not_wanted_list: {},
    trade_filters: {},
    wanted_filters: {},
    mirror: false,
    pref_lucky: false,
    registered: true,
    favorite: false,
    disabled: false,
    pokeball: null,
    location_card: null,
    location_caught: null,
    date_caught: null,
    date_added: '2026-01-01T00:00:00.000Z',
    last_update: 0,
    ...overrides,
  };
}

describe.sequential('useInstancesStore.setInstances() integration', () => {
  beforeAll(() => {
    enableLogging('verbose');
    testLogger.fileStart('Store Tests');
    testLogger.suiteStart('useInstancesStore.setInstances');
  });

  afterAll(() => {
    testLogger.suiteComplete();
    testLogger.fileEnd();
  });

  beforeEach(() => {
    useInstancesStore.setState({ instances: {}, instancesLoading: false });
    useAuthStore.setState({
      user: { user_id: 'u-1', username: 'testuser' } as any,
    });
    localStorage.clear();
  });

  it('skips when incoming set is empty', async () => {
    const current = {
      foo: makeInstance({ instance_id: 'foo' }),
    };
    useInstancesStore.setState({ instances: current });

    await act(async () => {
      await useInstancesStore.getState().setInstances({});
    });

    expect(useInstancesStore.getState().instances).toBe(current);
    expect(localStorage.getItem('ownershipTimestamp')).toBeNull();
  });

  it('skips when incoming matches existing state', async () => {
    const same = {
      x: makeInstance({ instance_id: 'x', username: 'testuser' }),
    };
    useInstancesStore.setState({ instances: same });

    await act(async () => {
      await useInstancesStore.getState().setInstances(same);
    });

    expect(useInstancesStore.getState().instances).toBe(same);
    expect(localStorage.getItem('ownershipTimestamp')).toBeNull();
  });

  it('updates state when incoming differs', async () => {
    const incoming = {
      '003_uuid3': makeInstance({
        instance_id: '003_uuid3',
        variant_id: '0003-default',
        pokemon_id: 3,
        username: 'testuser',
      }),
    };

    await act(async () => {
      await useInstancesStore.getState().setInstances(incoming);
    });

    expect(useInstancesStore.getState().instances['003_uuid3']).toBeDefined();
    expect(localStorage.getItem('ownershipTimestamp')).not.toBeNull();
  });
});
