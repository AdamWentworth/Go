import { act } from '@testing-library/react';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { useVariantsStore } from '@/features/variants/store/useVariantsStore';

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

describe.sequential('useInstancesStore.updateInstanceStatus() integration', () => {
  beforeAll(() => {
    enableLogging('verbose');
    testLogger.fileStart('Store Tests');
    testLogger.suiteStart('useInstancesStore.updateInstanceStatus');
  });

  afterAll(() => {
    testLogger.suiteComplete();
    testLogger.fileEnd();
  });

  beforeEach(() => {
    useVariantsStore.setState({
      variants: [makeVariant(), makeVariant({ variant_id: '0002-default', pokemon_id: 2 })],
    });
    useInstancesStore.setState({ instances: {}, instancesLoading: false });
  });

  it('marks one instance as Caught', async () => {
    const id = '11111111-1111-4111-8111-111111111111';
    useInstancesStore.setState({
      instances: {
        [id]: makeInstance({ instance_id: id, variant_id: '0001-default', is_caught: false }),
      },
    });

    const periodicSpy = vi
      .spyOn(useInstancesStore.getState(), 'periodicUpdates')
      .mockImplementation(() => {});

    await act(async () => {
      await useInstancesStore.getState().updateInstanceStatus(id, 'Caught');
    });

    const inst = useInstancesStore.getState().instances[id];
    expect(inst.is_caught).toBe(true);
    expect(inst.is_for_trade).toBe(false);
    expect(inst.is_wanted).toBe(false);
    expect(inst.registered).toBe(true);
    expect(periodicSpy).toHaveBeenCalled();
  });

  it('marks one instance as Missing', async () => {
    const id = '22222222-2222-4222-8222-222222222222';
    useInstancesStore.setState({
      instances: {
        [id]: makeInstance({
          instance_id: id,
          variant_id: '0001-default',
          is_caught: true,
          registered: true,
        }),
      },
    });

    const periodicSpy = vi
      .spyOn(useInstancesStore.getState(), 'periodicUpdates')
      .mockImplementation(() => {});

    await act(async () => {
      await useInstancesStore.getState().updateInstanceStatus(id, 'Missing');
    });

    const inst = useInstancesStore.getState().instances[id];
    expect(inst.is_caught).toBe(false);
    expect(inst.is_for_trade).toBe(false);
    expect(inst.is_wanted).toBe(false);
    expect(inst.registered).toBe(false);
    expect(periodicSpy).toHaveBeenCalled();
  });

  it('marks one instance as Wanted', async () => {
    const id = '33333333-3333-4333-8333-333333333333';
    useInstancesStore.setState({
      instances: {
        [id]: makeInstance({ instance_id: id, variant_id: '0001-default' }),
      },
    });

    const periodicSpy = vi
      .spyOn(useInstancesStore.getState(), 'periodicUpdates')
      .mockImplementation(() => {});

    await act(async () => {
      await useInstancesStore.getState().updateInstanceStatus(id, 'Wanted');
    });

    const inst = useInstancesStore.getState().instances[id];
    expect(inst.is_wanted).toBe(true);
    expect(inst.is_caught).toBe(false);
    expect(inst.is_for_trade).toBe(false);
    expect(inst.registered).toBe(true);
    expect(periodicSpy).toHaveBeenCalled();
  });

  it('updates multiple instances in one call', async () => {
    const idA = '44444444-4444-4444-8444-444444444444';
    const idB = '55555555-5555-4555-8555-555555555555';
    useInstancesStore.setState({
      instances: {
        [idA]: makeInstance({ instance_id: idA, variant_id: '0001-default' }),
        [idB]: makeInstance({
          instance_id: idB,
          variant_id: '0002-default',
          pokemon_id: 2,
        }),
      },
    });

    const periodicSpy = vi
      .spyOn(useInstancesStore.getState(), 'periodicUpdates')
      .mockImplementation(() => {});

    await act(async () => {
      await useInstancesStore.getState().updateInstanceStatus([idA, idB], 'Caught');
    });

    const state = useInstancesStore.getState().instances;
    expect(state[idA].is_caught).toBe(true);
    expect(state[idB].is_caught).toBe(true);
    expect(periodicSpy).toHaveBeenCalled();
  });
});
