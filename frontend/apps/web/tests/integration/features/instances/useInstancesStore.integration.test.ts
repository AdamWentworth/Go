import { act } from '@testing-library/react';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { useVariantsStore } from '@/features/variants/store/useVariantsStore';
import { useAuthStore } from '@/stores/useAuthStore';

import type { PokemonInstance } from '@/types/pokemonInstance';
import type { PokemonVariant } from '@/types/pokemonVariants';

import { enableLogging, testLogger } from '../setupTests';

function makeVariant(overrides: Partial<PokemonVariant> = {}): PokemonVariant {
  return {
    variant_id: '0001-default',
    pokemon_id: 1,
    species_name: 'Bulbasaur',
    variantType: 'default',
    currentImage: '/images/default/pokemon_1.png',
    costumes: [],
    ...overrides,
  } as PokemonVariant;
}

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
    is_caught: false,
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
    registered: false,
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

describe.sequential('useInstancesStore integration', () => {
  beforeAll(() => {
    enableLogging('verbose');
    testLogger.fileStart('Store Tests');
    testLogger.suiteStart('useInstancesStore Integration');
  });

  afterAll(() => {
    testLogger.suiteComplete();
    testLogger.fileEnd();
  });

  beforeEach(() => {
    useInstancesStore.setState({ instances: {}, instancesLoading: true, foreignInstances: null });
    useVariantsStore.setState({ variants: [makeVariant()] });
    useAuthStore.setState({
      user: {
        user_id: 'test123',
        username: 'testuser',
      } as any,
    });
    localStorage.clear();
  });

  it('hydrates instances and clears loading', () => {
    const id = 'inst-hydrate';
    const data = { [id]: makeInstance({ instance_id: id }) };

    act(() => {
      useInstancesStore.getState().hydrateInstances(data);
    });

    const state = useInstancesStore.getState();
    expect(state.instances[id]).toBeDefined();
    expect(state.instancesLoading).toBe(false);
  });

  it('updates status through store action', async () => {
    const id = '66666666-6666-4666-8666-666666666666';
    useInstancesStore.setState({
      instances: {
        [id]: makeInstance({ instance_id: id, variant_id: '0001-default', is_caught: false }),
      },
      instancesLoading: false,
    });

    const periodicSpy = vi
      .spyOn(useInstancesStore.getState(), 'periodicUpdates')
      .mockImplementation(() => {});

    await act(async () => {
      await useInstancesStore.getState().updateInstanceStatus(id, 'Caught');
    });

    const updated = useInstancesStore.getState().instances[id];
    expect(updated.is_caught).toBe(true);
    expect(updated.registered).toBe(true);
    expect(periodicSpy).toHaveBeenCalled();
  });

  it('sets and resets foreign instances', () => {
    const foreign = { foreignA: makeInstance({ instance_id: 'foreignA', username: 'other' }) };

    act(() => {
      useInstancesStore.getState().setForeignInstances(foreign);
    });
    expect(useInstancesStore.getState().foreignInstances).toEqual(foreign);

    act(() => {
      useInstancesStore.getState().resetForeignInstances();
    });
    expect(useInstancesStore.getState().foreignInstances).toBeNull();
  });

  it('resetInstances clears state and timestamp', () => {
    useInstancesStore.setState({
      instances: {
        foo: makeInstance({ instance_id: 'foo' }),
      },
      instancesLoading: false,
    });
    localStorage.setItem('ownershipTimestamp', '12345');

    act(() => {
      useInstancesStore.getState().resetInstances();
    });

    const { instances, instancesLoading } = useInstancesStore.getState();
    expect(instances).toEqual({});
    expect(instancesLoading).toBe(true);
    expect(localStorage.getItem('ownershipTimestamp')).toBeNull();
  });

  it('periodicUpdates exists and does not throw', () => {
    expect(() => {
      useInstancesStore.getState().periodicUpdates();
    }).not.toThrow();
  });
});
