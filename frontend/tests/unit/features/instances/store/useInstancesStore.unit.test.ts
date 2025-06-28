// tests/instances/unit/useInstancesStore.unit.test.ts
import { act } from '@testing-library/react';
import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { useVariantsStore } from '@/features/variants/store/useVariantsStore';
import { useLiveInstances } from '../../utils/liveInstancesCache';
import { useLiveVariants } from '../../utils/liveVariantCache';
import { enableLogging, testLogger } from '../../setupTests';
import type { Instances } from '@/types/instances';
import type { PokemonInstance } from '@/types/pokemonInstance';

// Factory for creating test instances (fallback for tests not using live instances)
const createTestInstance = (overrides: Partial<PokemonInstance> = {}): PokemonInstance => ({
  instance_id: `test_${Math.random().toString(36).slice(2)}`,
  pokemonKey: '0001-default',
  is_owned: false,
  is_unowned: true,
  last_update: Date.now(),
  dynamax: false,
  gigantamax: false,
  ...overrides,
} as PokemonInstance);

describe('🏪 useInstancesStore', () => {
  beforeAll(() => {
    enableLogging('verbose');
    testLogger.fileStart('Store Tests');
    testLogger.suiteStart('useInstancesStore');
  });

  afterAll(() => {
    testLogger.suiteComplete();
    testLogger.fileEnd();
  });

  beforeEach(async () => {
    useInstancesStore.setState({
      instances: {},
      instancesLoading: true,
    });
    useVariantsStore.setState({
      variants: [],
    });
    localStorage.clear();

    // Load variants to ensure useVariantsStore is populated
    const variants = await useLiveVariants();
    useVariantsStore.setState({ variants });
  });

  it('should initialize with empty state', () => {
    testLogger.testStep('Verifying initial empty state');
    const state = useInstancesStore.getState();
    expect(state.instances).toEqual({});
    expect(state.instancesLoading).toBe(true);
  });

  it('should hydrate instances from external data', async () => {
    testLogger.testStep('Creating hydration data');
    const liveInstances = await useLiveInstances();
    const instanceIds = Object.keys(liveInstances);
    if (instanceIds.length < 2) throw new Error('Not enough instances available for test');
    const mockData: Instances = {
      [instanceIds[0]]: { ...liveInstances[instanceIds[0]], is_owned: true },
      [instanceIds[1]]: { ...liveInstances[instanceIds[1]], is_wanted: true },
    };

    act(() => {
      useInstancesStore.getState().hydrateInstances(mockData);
    });

    const { instances, instancesLoading } = useInstancesStore.getState();
    expect(Object.keys(instances)).toHaveLength(2);
    expect(instancesLoading).toBe(false);
  });

  it('should handle external instance updates via setInstances', async () => {
    testLogger.testStep('Setting up merge scenario');
    const liveInstances = await useLiveInstances();
    const instanceIds = Object.keys(liveInstances);
    if (instanceIds.length < 2) throw new Error('Not enough instances available for test');
    const initialData: Instances = {
      [instanceIds[0]]: { ...liveInstances[instanceIds[0]], is_owned: true },
    };
    const incomingData: Instances = {
      [instanceIds[1]]: { ...liveInstances[instanceIds[1]], is_wanted: true },
    };

    act(() => {
      useInstancesStore.getState().hydrateInstances(initialData);
      useInstancesStore.getState().setInstances(incomingData);
    });

    const { instances } = useInstancesStore.getState();
    expect(Object.keys(instances)).toHaveLength(2);
    expect(instances[instanceIds[0]].is_owned).toBe(true);
    expect(instances[instanceIds[1]].is_wanted).toBe(true);
  });

  it('should handle status updates through the store API', async () => {
    testLogger.testStep('Setting up test instance');
    const liveInstances = await useLiveInstances();
    const instanceId = Object.keys(liveInstances)[0];
    if (!instanceId) throw new Error('No instances available for test');
    const mockInstance = {
      ...liveInstances[instanceId],
      dynamax: liveInstances[instanceId].dynamax ?? false,
      gigantamax: liveInstances[instanceId].gigantamax ?? false,
    };
    console.log('Test instance:', { instanceId, pokemonKey: mockInstance.pokemonKey, instance: mockInstance });
    console.log('Variants:', useVariantsStore.getState().variants);
    act(() => {
      useInstancesStore.getState().hydrateInstances({ [instanceId]: mockInstance });
    });

    testLogger.testStep('Executing status update');
    await act(async () => {
      await useInstancesStore.getState().updateInstanceStatus(instanceId, 'Owned');
    });

    const updated = useInstancesStore.getState().instances[instanceId];
    expect(updated.is_owned).toBe(true);
    expect(updated.is_unowned).toBe(false);
  });

  it('should handle detail updates through the store API', async () => {
    testLogger.testStep('Setting up test instance');
    const liveInstances = await useLiveInstances();
    const instanceId = Object.keys(liveInstances)[0];
    if (!instanceId) throw new Error('No instances available for test');
    const mockInstance = {
      ...liveInstances[instanceId],
      dynamax: liveInstances[instanceId].dynamax ?? false,
      gigantamax: liveInstances[instanceId].gigantamax ?? false,
    };
    act(() => {
      useInstancesStore.getState().hydrateInstances({ [instanceId]: mockInstance });
    });

    testLogger.testStep('Executing detail update');
    await act(async () => {
      await useInstancesStore.getState().updateInstanceDetails(instanceId, {
        nickname: 'TestMon',
        cp: 1500,
      });
    });

    const updated = useInstancesStore.getState().instances[instanceId];
    expect(updated.nickname).toBe('TestMon');
    expect(updated.cp).toBe(1500);
    expect(updated.last_update).toBeGreaterThan(mockInstance.last_update);
  });

  it('should handle empty patch in updateInstanceDetails', async () => {
    testLogger.testStep('Setting up test instance');
    const liveInstances = await useLiveInstances();
    const instanceId = Object.keys(liveInstances)[0];
    if (!instanceId) throw new Error('No instances available for test');
    const mockInstance = {
      ...liveInstances[instanceId],
      dynamax: liveInstances[instanceId].dynamax ?? false,
      gigantamax: liveInstances[instanceId].gigantamax ?? false,
    };
    act(() => {
      useInstancesStore.getState().hydrateInstances({ [instanceId]: mockInstance });
    });

    testLogger.testStep('Executing detail update with empty patch');
    await act(async () => {
      await useInstancesStore.getState().updateInstanceDetails(instanceId, {});
    });

    const updated = useInstancesStore.getState().instances[instanceId];
    expect(updated).toEqual(mockInstance);
  });

  it('should handle multiple keys in updateInstanceDetails', async () => {
    testLogger.testStep('Setting up test instances');
    const liveInstances = await useLiveInstances();
    const instanceIds = Object.keys(liveInstances).slice(0, 2);
    if (instanceIds.length < 2) throw new Error('Not enough instances available for test');
    const mockData: Instances = {
      [instanceIds[0]]: {
        ...liveInstances[instanceIds[0]],
        dynamax: false,
        gigantamax: false,
      },
      [instanceIds[1]]: {
        ...liveInstances[instanceIds[1]],
        dynamax: false,
        gigantamax: false,
      },
    };
    act(() => {
      useInstancesStore.getState().hydrateInstances(mockData);
    });

    testLogger.testStep('Executing detail update for multiple keys');
    await act(async () => {
      await useInstancesStore.getState().updateInstanceDetails(instanceIds, {
        nickname: 'MultiMon',
        cp: 2000,
      });
    });

    const instances = useInstancesStore.getState().instances;
    expect(instances[instanceIds[0]].nickname).toBe('MultiMon');
    expect(instances[instanceIds[0]].cp).toBe(2000);
    expect(instances[instanceIds[1]].nickname).toBe('MultiMon');
    expect(instances[instanceIds[1]].cp).toBe(2000);
  });

  it('should handle PatchMap in updateInstanceDetails', async () => {
    testLogger.testStep('Setting up test instances');
    const liveInstances = await useLiveInstances();
    const instanceIds = Object.keys(liveInstances).slice(0, 2);
    if (instanceIds.length < 2) throw new Error('Not enough instances available for test');
    const mockData: Instances = {
      [instanceIds[0]]: {
        ...liveInstances[instanceIds[0]],
        dynamax: false,
        gigantamax: false,
      },
      [instanceIds[1]]: {
        ...liveInstances[instanceIds[1]],
        dynamax: false,
        gigantamax: false,
      },
    };
    act(() => {
      useInstancesStore.getState().hydrateInstances(mockData);
    });

    testLogger.testStep('Executing detail update with PatchMap');
    const patchMap = {
      [instanceIds[0]]: { nickname: 'FirstMon', cp: 1000 },
      [instanceIds[1]]: { nickname: 'SecondMon', cp: 2000 },
    };
    await act(async () => {
      await useInstancesStore.getState().updateInstanceDetails(patchMap);
    });

    const instances = useInstancesStore.getState().instances;
    expect(instances[instanceIds[0]].nickname).toBe('FirstMon');
    expect(instances[instanceIds[0]].cp).toBe(1000);
    expect(instances[instanceIds[1]].nickname).toBe('SecondMon');
    expect(instances[instanceIds[1]].cp).toBe(2000);
  });

  it('should handle invalid key in updateInstanceDetails', async () => {
    testLogger.testStep('Executing detail update with invalid key');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const invalidId = 'invalid_id';
    const patch = { nickname: 'TestMon', cp: 1500 };
    await act(async () => {
      await useInstancesStore.getState().updateInstanceDetails(invalidId, patch);
    });

    const instances = useInstancesStore.getState().instances;
    expect(instances[invalidId]).toBeDefined();
    expect(instances[invalidId].nickname).toBe('TestMon');
    expect(instances[invalidId].cp).toBe(1500);
    expect(instances[invalidId].last_update).toBeDefined();
    expect(warnSpy).toHaveBeenCalledWith(`[updateInstanceDetails] "${invalidId}" missing – creating placeholder`);
    warnSpy.mockRestore();
  });

  it('should create valid placeholder instance for missing key in updateInstanceDetails', async () => {
    testLogger.testStep('Executing detail update with missing key and valid patch');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const missingId = 'missing_id';
    const patch = {
      instance_id: missingId,
      pokemonKey: '0001-default',
      is_owned: false,
      is_unowned: true,
      nickname: 'NewMon',
      cp: 1000,
    };
    await act(async () => {
      await useInstancesStore.getState().updateInstanceDetails(missingId, patch);
    });

    const instances = useInstancesStore.getState().instances;
    expect(instances[missingId]).toBeDefined();
    expect(instances[missingId].instance_id).toBe(missingId);
    expect(instances[missingId].pokemonKey).toBe('0001-default');
    expect(instances[missingId].is_owned).toBe(false);
    expect(instances[missingId].is_unowned).toBe(true);
    expect(instances[missingId].nickname).toBe('NewMon');
    expect(instances[missingId].cp).toBe(1000);
    expect(instances[missingId].last_update).toBeDefined();
    expect(warnSpy).toHaveBeenCalledWith(`[updateInstanceDetails] "${missingId}" missing – creating placeholder`);
    warnSpy.mockRestore();
  });

  it('should handle store reset correctly', () => {
    testLogger.testStep('Populating store data');
    act(() => {
      useInstancesStore.getState().hydrateInstances({
        '001_test': createTestInstance(),
        '002_test': createTestInstance(),
      });
    });

    testLogger.testStep('Executing reset');
    act(() => {
      useInstancesStore.getState().resetInstances();
    });

    const { instances, instancesLoading } = useInstancesStore.getState();
    expect(instances).toEqual({});
    expect(instancesLoading).toBe(true);
    expect(localStorage.getItem('ownershipTimestamp')).toBeUndefined();
  });

  it('should handle SW sync failures gracefully', async () => {
    testLogger.testStep('Mocking service worker failure');
    const liveInstances = await useLiveInstances();
    const instanceId = Object.keys(liveInstances)[0];
    if (!instanceId) throw new Error('No instances available for test');
    const mockInstance = {
      ...liveInstances[instanceId],
      dynamax: liveInstances[instanceId].dynamax ?? false,
      gigantamax: liveInstances[instanceId].gigantamax ?? false,
    };
    console.log('SW sync test instance:', { instanceId, pokemonKey: mockInstance.pokemonKey, instance: mockInstance });
    act(() => {
      useInstancesStore.getState().hydrateInstances({ [instanceId]: mockInstance });
    });

    vi.spyOn(navigator.serviceWorker, 'ready', 'get').mockRejectedValue(new Error('SW unavailable'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    testLogger.testStep('Executing update that triggers SW sync');
    await act(async () => {
      await useInstancesStore.getState().updateInstanceStatus(instanceId, 'Owned');
    });

    testLogger.testStep('Verifying completion despite SW failure');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('SW / IndexedDB sync failed'),
      expect.any(Error)
    );
    consoleErrorSpy.mockRestore();
  });

  it('should handle empty pokemonKeys in updateInstanceStatus', async () => {
    testLogger.testStep('Executing status update with empty pokemonKeys');
    await act(async () => {
      await useInstancesStore.getState().updateInstanceStatus([], 'Owned');
    });
    expect(useInstancesStore.getState().instances).toEqual({});
  });

  it('should handle invalid instance_id in updateInstanceStatus', async () => {
    testLogger.testStep('Executing status update with invalid instance_id');
    await act(async () => {
      await useInstancesStore.getState().updateInstanceStatus('invalid_id', 'Owned');
    });
    expect(useInstancesStore.getState().instances).toEqual({});
  });

  it('should handle multiple pokemonKeys in updateInstanceStatus', async () => {
    testLogger.testStep('Setting up test instances');
    const liveInstances = await useLiveInstances();
    const instanceIds = Object.keys(liveInstances).slice(0, 2);
    if (instanceIds.length < 2) throw new Error('Not enough instances available for test');
    const mockData: Instances = {
      [instanceIds[0]]: { ...liveInstances[instanceIds[0]], dynamax: false, gigantamax: false },
      [instanceIds[1]]: { ...liveInstances[instanceIds[1]], dynamax: false, gigantamax: false },
    };
    act(() => {
      useInstancesStore.getState().hydrateInstances(mockData);
    });

    testLogger.testStep('Executing status update for multiple keys');
    await act(async () => {
      await useInstancesStore.getState().updateInstanceStatus(instanceIds, 'Owned');
    });

    const instances = useInstancesStore.getState().instances;
    expect(instances[instanceIds[0]].is_owned).toBe(true);
    expect(instances[instanceIds[1]].is_owned).toBe(true);
  });

  it('should handle empty incoming data in setInstances', () => {
    testLogger.testStep('Executing setInstances with empty data');
    act(() => {
      useInstancesStore.getState().setInstances({});
    });
    expect(useInstancesStore.getState().instances).toEqual({});
  });

  it('should schedule periodic updates', () => {
    testLogger.testStep('Executing periodicUpdates call');
    const spy = vi.spyOn(console, 'log');
    vi.spyOn(navigator.serviceWorker, 'ready', 'get').mockResolvedValue({
      active: { postMessage: vi.fn() },
    } as any);

    act(() => {
      useInstancesStore.getState().periodicUpdates();
    });

    const calls = spy.mock.calls.map(args => args[0]);
    const firstMsg =
      'First call: Triggering immediate update.';
    const waitMsg =
      'Function called again but is currently waiting for the timer to expire.';

    // Accept either the "first call" path or the "already-waiting" path:
    expect(calls.includes(firstMsg) || calls.includes(waitMsg)).toBe(true);

    spy.mockRestore();
  });

  it('should handle subsequent periodic updates calls', () => {
    testLogger.testStep('Executing second periodicUpdates call');
    const spy = vi.spyOn(console, 'log');
    vi.spyOn(navigator.serviceWorker, 'ready', 'get').mockResolvedValue({
      active: { postMessage: vi.fn() },
    } as any);

    act(() => {
      useInstancesStore.getState().periodicUpdates();
      useInstancesStore.getState().periodicUpdates(); // Second call
    });

    expect(spy).toHaveBeenCalledWith('Function called again but is currently waiting for the timer to expire.');
    spy.mockRestore();
  });
});