import { act } from '@testing-library/react';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { useVariantsStore } from '@/features/variants/store/useVariantsStore';
import { useAuthStore } from '@/stores/useAuthStore';
import * as idb from '@/db/indexedDB';

import type { Instances } from '@/types/instances';
import type { PokemonInstance } from '@/types/pokemonInstance';
import type { PokemonVariant } from '@/types/pokemonVariants';

import { useLiveInstances } from '../../utils/liveInstancesCache';
import { useLiveVariants } from '../../utils/liveVariantCache';
import { enableLogging, testLogger } from '../../setupTests';

vi.mock('@/db/indexedDB', async () => {
  const actual = await vi.importActual('@/db/indexedDB');
  return {
    ...actual,
    clearInstancesStore: vi.fn(() => Promise.resolve()),
  };
});

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
    instance_id: '11111111-1111-4111-8111-111111111111',
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

describe.sequential('Workflow: live instances cache + store', () => {
  let liveInstances: Instances;
  let instanceKeys: string[];

  beforeAll(() => {
    enableLogging('verbose');
    testLogger.fileStart('Store Workflows');
    testLogger.suiteStart('Live Instances Cache + Store Workflow');
  });

  afterAll(() => {
    testLogger.suiteComplete();
    testLogger.fileEnd();
  });

  beforeEach(async () => {
    useInstancesStore.setState({ instances: {}, instancesLoading: true });
    useAuthStore.setState({
      user: { username: 'testuser', user_id: 'test123', email: 'test@example.com' } as any,
    });

    localStorage.clear();
    await idb.clearInstancesStore();

    const variants = await useLiveVariants();
    useVariantsStore.setState({ variants });

    liveInstances = await useLiveInstances();
    instanceKeys = Object.keys(liveInstances);
    await act(async () => {
      await useInstancesStore.getState().hydrateInstances(liveInstances);
    });
  });

  it('hydrates instances from live fixture', () => {
    const { instances, instancesLoading } = useInstancesStore.getState();

    expect(instancesLoading).toBe(false);
    expect(Object.keys(instances)).toHaveLength(Object.keys(liveInstances).length);

    for (const key of instanceKeys) {
      expect(instances[key]).toBeDefined();
      expect(instances[key].instance_id).toBe(liveInstances[key].instance_id);
    }
  });

  it('updates canonical status on a canonical instance', async () => {
    const targetId = '11111111-1111-4111-8111-111111111111';
    useVariantsStore.setState({ variants: [makeVariant()] });
    useInstancesStore.setState({
      instances: {
        [targetId]: makeInstance({ instance_id: targetId }),
      },
      instancesLoading: false,
    });

    await act(async () => {
      await useInstancesStore.getState().updateInstanceStatus(targetId, 'Caught');
    });

    const updated = useInstancesStore.getState().instances[targetId];
    expect(updated.is_caught).toBe(true);
    expect(updated.is_for_trade).toBe(false);
    expect(updated.is_wanted).toBe(false);
  });

  it('updates instance details after hydration', async () => {
    const targetId = instanceKeys[0];

    await act(async () => {
      await useInstancesStore.getState().updateInstanceDetails(targetId, { nickname: 'Sparky' });
    });

    const updated = useInstancesStore.getState().instances[targetId];
    expect(updated.nickname).toBe('Sparky');
  });

  it('handles multiple canonical updates', async () => {
    const ids = [
      '33333333-3333-4333-8333-333333333333',
      '44444444-4444-4444-8444-444444444444',
    ];

    useVariantsStore.setState({
      variants: [
        makeVariant({ variant_id: '0001-default', pokemon_id: 1 }),
        makeVariant({ variant_id: '0002-default', pokemon_id: 2 }),
      ],
    });
    useInstancesStore.setState({
      instances: {
        [ids[0]]: makeInstance({
          instance_id: ids[0],
          variant_id: '0001-default',
          pokemon_id: 1,
        }),
        [ids[1]]: makeInstance({
          instance_id: ids[1],
          variant_id: '0002-default',
          pokemon_id: 2,
        }),
      },
      instancesLoading: false,
    });

    await act(async () => {
      await useInstancesStore.getState().updateInstanceStatus(ids, 'Wanted');
      await useInstancesStore.getState().updateInstanceDetails(ids, { cp: 777 });
    });

    const state = useInstancesStore.getState().instances;
    for (const id of ids) {
      expect(state[id].is_wanted).toBe(true);
      expect(state[id].cp).toBe(777);
    }
  });
});
