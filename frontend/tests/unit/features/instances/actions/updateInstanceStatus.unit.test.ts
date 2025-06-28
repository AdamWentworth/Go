// tests/instances/unit/updateInstanceStatus.unit.test.ts

import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import type { MockedFunction } from 'vitest';
import { updateInstanceStatus } from '@/features/instances/actions/updateInstanceStatus';
import * as service from '@/features/instances/services/updatePokemonInstanceStatus';
import type { InstanceStatus, Instances } from '@/types/instances';
import type { PokemonVariant } from '@/types/pokemonVariants';
import * as db from '@/db/indexedDB';
import { enableLogging, testLogger } from '../../setupTests';

describe('updateInstanceStatus', () => {
  beforeAll(() => {
    enableLogging('verbose');
    testLogger.fileStart('updateInstanceStatus');
    testLogger.suiteStart('updateInstanceStatus unit tests');
  });

  afterAll(() => {
    testLogger.suiteComplete();
    testLogger.fileEnd();
  });

  let setData: (updater: (prev: any) => any) => any;
  let updatedState: any;
  let instancesDataRef: { current: Record<string, any> };

  const initialInstances: Instances = {
    a: { is_owned: false, is_unowned: true, is_for_trade: false, is_wanted: false, last_update: 0 } as any,
    b: { is_owned: false, is_unowned: true, is_for_trade: false, is_wanted: false, last_update: 0 } as any,
  };

  let updateSpy: MockedFunction<typeof service.updatePokemonInstanceStatus>;

  beforeEach(() => {
    testLogger.suiteStart('reset mocks and spies');
    vi.restoreAllMocks();

    vi.spyOn(Date, 'now').mockReturnValue(1000);

    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        ready: Promise.resolve(
          ({ active: { postMessage: vi.fn() } } as unknown) as ServiceWorkerRegistration
        ),
      } as any,
    });

    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {});
    vi.spyOn(db, 'putBatchedPokemonUpdates').mockResolvedValue(undefined);

    updateSpy = vi.spyOn(service, 'updatePokemonInstanceStatus') as MockedFunction<
      typeof service.updatePokemonInstanceStatus
    >;

    updateSpy.mockImplementation(
      (key: string, newStatus: InstanceStatus, variants: PokemonVariant[], tempData: Instances) => {
        if (!tempData[key]) tempData[key] = {} as any;
        tempData[key] = {
          ...tempData[key],
          is_owned: newStatus === 'Owned' || newStatus === 'Trade',
          is_unowned: newStatus === 'Unowned',
          is_for_trade: newStatus === 'Trade',
          is_wanted: newStatus === 'Wanted',
          last_update: 1000, // Ensure last_update is set
        };
        return key;
      }
    );

    instancesDataRef = { current: { ...initialInstances } };
    updatedState = undefined;
    setData = vi.fn((updater: (prev: any) => any) => {
      const prev = { instances: { ...instancesDataRef.current } };
      updatedState = updater(prev);
      return updatedState;
    });

    testLogger.suiteComplete();
  });

  it('updates a single key and persists it', async () => {
    testLogger.suiteStart('updates a single key and persists it');

    const updater = updateInstanceStatus(
      { variants: [], instances: instancesDataRef.current },
      setData,
      instancesDataRef
    );

    await updater('a', 'Owned');

    expect(setData).toHaveBeenCalledTimes(2); // Called twice: tempData and finalData

    const result = updatedState.instances;
    expect(result.a).toMatchObject({
      is_owned: true,
      is_unowned: false,
    });

    expect(db.putBatchedPokemonUpdates).toHaveBeenCalledWith(
      'a',
      expect.objectContaining({ last_update: 1000, is_owned: true })
    );

    testLogger.suiteComplete();
  });

  it('updates multiple keys at once', async () => {
    testLogger.suiteStart('updates multiple keys at once');

    const updater = updateInstanceStatus(
      { variants: [], instances: instancesDataRef.current },
      setData,
      instancesDataRef
    );

    await updater(['a', 'b'], 'Trade');

    expect(setData).toHaveBeenCalledTimes(2); // Called twice: tempData and finalData

    const result = updatedState.instances;
    ['a', 'b'].forEach(key => {
      expect(result[key]).toMatchObject({
        is_owned: true,
        is_for_trade: true,
        is_unowned: false,
      });
    });

    expect(db.putBatchedPokemonUpdates).toHaveBeenCalledTimes(2);

    testLogger.suiteComplete();
  });

  it('handles creation of a new instance key', async () => {
    testLogger.suiteStart('handles creation of a new instance key');

    updateSpy.mockImplementationOnce(
      (key, newStatus, variants, tempData) => {
        const newKey = 'c';
        tempData[newKey] = { foo: 'bar' } as any;
        return newKey;
      }
    );

    const updater = updateInstanceStatus(
      { variants: [], instances: instancesDataRef.current },
      setData,
      instancesDataRef
    );

    await updater('x', 'Wanted');

    const result = updatedState.instances;
    expect(result.c).toMatchObject({ foo: 'bar' });

    expect(db.putBatchedPokemonUpdates).toHaveBeenCalledWith(
      'c',
      expect.objectContaining({ last_update: 1000 })
    );

    testLogger.suiteComplete();
  });

  it('prunes unowned instances that have siblings', async () => {
    testLogger.suiteStart('prunes unowned instances that have siblings');

    instancesDataRef.current = {
      'a_1': { is_unowned: true, is_owned: false, is_for_trade: false, is_wanted: false, last_update: 0 } as any,
      'a_2': { is_unowned: false, is_owned: true, is_for_trade: false, is_wanted: false, last_update: 0 } as any,
    };

    updateSpy.mockImplementationOnce(
      (key, newStatus, variants, tempData) => {
        tempData[key].is_unowned = true;
        tempData[key].is_owned = false;
        return key;
      }
    );

    const updater = updateInstanceStatus(
      { variants: [], instances: instancesDataRef.current },
      setData,
      instancesDataRef
    );

    await updater('a_1', 'Unowned');

    const result = updatedState.instances;
    expect(result).not.toHaveProperty('a_1');

    testLogger.suiteComplete();
  });

  it('logs error but continues when service worker or DB update fails', async () => {
    testLogger.suiteStart('handle SW or DB failures gracefully');

    console.error = vi.fn();

    // Use consistent mock that ensures changes
    updateSpy.mockImplementation(
      (key, newStatus, variants, tempData) => {
        if (!tempData[key]) tempData[key] = {} as any;
        tempData[key] = {
          ...tempData[key], // Preserve existing properties
          is_owned: newStatus === 'Owned' || newStatus === 'Trade',
          is_unowned: newStatus === 'Unowned',
          is_for_trade: newStatus === 'Trade',
          is_wanted: newStatus === 'Wanted',
          last_update: 1000, // Ensure last_update is set to trigger change
        };
        return key;
      }
    );

    vi.spyOn(db, 'putBatchedPokemonUpdates')
      .mockRejectedValueOnce(new Error('fail a'))
      .mockResolvedValueOnce(undefined);

    const updater = updateInstanceStatus(
      { variants: [], instances: instancesDataRef.current },
      setData,
      instancesDataRef
    );

    await updater(['a', 'b'], 'Owned');

    // Expect 2 calls even if one fails
    expect(db.putBatchedPokemonUpdates).toHaveBeenCalledTimes(2);

    // Check error logged
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('DB write failed for a'),
      expect.any(Error)
    );

    testLogger.suiteComplete();
  });

  it('assigns a UUID when updating a baseKey instance', async () => {
    testLogger.suiteStart('assign UUID for baseKey instances');

    const baseKeyInstance = {
      a: { is_owned: false, is_unowned: true, is_for_trade: false, is_wanted: false, last_update: 0 }
    };

    instancesDataRef.current = { ...baseKeyInstance };

    let calledUUID: string | null = null;

    updateSpy.mockImplementationOnce((key, newStatus, variants, tempData) => {
      if (!tempData[key].uuid) {
        tempData[key].uuid = 'generated-uuid-123';
        calledUUID = String(tempData[key].uuid);
      }
      tempData[key].is_owned = true;
      return key;
    });

    const updater = updateInstanceStatus(
      { variants: [], instances: instancesDataRef.current },
      setData,
      instancesDataRef
    );

    await updater('a', 'Owned');

    const result = updatedState.instances;
    expect(result.a.uuid).toBe('generated-uuid-123');
    expect(calledUUID).toBe('generated-uuid-123');

    testLogger.suiteComplete();
  });

  it('blocks status update if Pokémon is shadow/lucky/mega (special conditions)', async () => {
    testLogger.suiteStart('blocking forbidden updates for shadow/lucky/mega Pokémon');

    // Set up a shadow Pokémon
    instancesDataRef.current = {
      a: { is_owned: true, is_unowned: false, is_shadow: true, is_for_trade: false, is_wanted: false, last_update: 0 }
    };

    // Spy the update function to simulate the "no-op" behavior
    updateSpy.mockImplementationOnce(
      (key, newStatus, variants, tempData) => {
        // Simulate detection of forbidden move
        if (tempData[key].is_shadow && (newStatus === 'Trade' || newStatus === 'Wanted')) {
          return null; // ← block
        }
        tempData[key].is_for_trade = true;
        return key;
      }
    );

    const updater = updateInstanceStatus(
      { variants: [], instances: instancesDataRef.current },
      setData,
      instancesDataRef
    );

    // Attempt to Trade a shadow Pokémon
    await updater('a', 'Trade');

    // Check that setData was called but nothing changed
    expect(setData).toHaveBeenCalledTimes(2); // Called twice: tempData and finalData

    const result = updatedState.instances;
    expect(result.a.is_for_trade).toBe(false); // Should NOT have changed
    expect(db.putBatchedPokemonUpdates).not.toHaveBeenCalled(); // No DB write

    testLogger.suiteComplete();
  });
});