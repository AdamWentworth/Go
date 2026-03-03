import { act } from '@testing-library/react';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { useInstancesStore } from '@/features/instances/store/useInstancesStore';

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

describe.sequential('useInstancesStore.updateInstanceDetails() integration', () => {
  beforeAll(() => {
    enableLogging('verbose');
    testLogger.fileStart('Store Tests');
    testLogger.suiteStart('useInstancesStore.updateInstanceDetails Integration');
  });

  afterAll(() => {
    testLogger.suiteComplete();
    testLogger.fileEnd();
  });

  beforeEach(() => {
    useInstancesStore.setState({ instances: {}, instancesLoading: false });
  });

  it('applies a single-field patch to one instance', async () => {
    const id = 'inst-single';
    useInstancesStore.setState({
      instances: {
        [id]: makeInstance({ instance_id: id }),
      },
    });

    const periodicSpy = vi
      .spyOn(useInstancesStore.getState(), 'periodicUpdates')
      .mockImplementation(() => {});

    await act(async () => {
      await useInstancesStore.getState().updateInstanceDetails(id, { nickname: 'Zubat' });
    });

    const inst = useInstancesStore.getState().instances[id];
    expect(inst.nickname).toBe('Zubat');
    expect(periodicSpy).toHaveBeenCalled();
  });

  it('applies one patch across multiple instances', async () => {
    const idA = 'inst-a';
    const idB = 'inst-b';
    useInstancesStore.setState({
      instances: {
        [idA]: makeInstance({ instance_id: idA }),
        [idB]: makeInstance({ instance_id: idB, pokemon_id: 2, variant_id: '0002-default' }),
      },
    });

    await act(async () => {
      await useInstancesStore.getState().updateInstanceDetails([idA, idB], { cp: 500 });
    });

    const state = useInstancesStore.getState().instances;
    expect(state[idA].cp).toBe(500);
    expect(state[idB].cp).toBe(500);
  });

  it('applies per-instance patches via PatchMap', async () => {
    const idA = 'inst-map-a';
    const idB = 'inst-map-b';
    useInstancesStore.setState({
      instances: {
        [idA]: makeInstance({ instance_id: idA }),
        [idB]: makeInstance({ instance_id: idB, pokemon_id: 2, variant_id: '0002-default' }),
      },
    });

    await act(async () => {
      await useInstancesStore.getState().updateInstanceDetails({
        [idA]: { cp: 100 },
        [idB]: { nickname: 'Onix' },
      });
    });

    const state = useInstancesStore.getState().instances;
    expect(state[idA].cp).toBe(100);
    expect(state[idB].nickname).toBe('Onix');
  });
});
