// tests/instances/unit/updateInstanceDetails.unit.test.ts

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { updateInstanceDetails } from '@/features/instances/actions/updateInstanceDetails';
import * as db from '@/db/indexedDB';
import { enableLogging, testLogger } from '../../setupTests';

type PokemonInstance = Record<string, any>;

describe('updateInstanceDetails', () => {
  beforeAll(() => {
    enableLogging('verbose');
    testLogger.fileStart('updateInstanceDetails');
    testLogger.suiteStart('updateInstanceDetails unit tests');
  });

  afterAll(() => {
    testLogger.suiteComplete();
    testLogger.fileEnd();
  });

  let setData: (updater: (prev: any) => any) => any;
  let updatedState: any;

  const initialData = {
    instances: {
      a: { foo: 1, last_update: 0 },
      b: { bar: 2, last_update: 0 },
    } as Record<string, PokemonInstance>,
  };

  beforeEach(() => {
    testLogger.suiteStart('reset mocks and spies');
    vi.restoreAllMocks();
    vi.spyOn(Date, 'now').mockReturnValue(1234);

    const fakeReg: Partial<ServiceWorkerRegistration> = {
      active: { postMessage: vi.fn() } as any,
    };
    (navigator as any).serviceWorker = {
      ready: Promise.resolve(fakeReg as ServiceWorkerRegistration),
    };

    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {});
    vi.spyOn(db, 'putBatchedPokemonUpdates').mockResolvedValue(undefined);

    updatedState = undefined;
    setData = vi.fn((updater: (prev: any) => any) => {
      const prev = { instances: { ...initialData.instances } };
      updatedState = updater(prev);
      return updatedState;
    });

    testLogger.suiteComplete();
  });

  it('applies a full per-key patch map and persists each', async () => {
    testLogger.suiteStart('applies a full per-key patch map and persists each');

    testLogger.testStep('stubbing console.warn');
    console.warn = vi.fn();

    testLogger.testStep('creating updater');
    const updater = updateInstanceDetails(initialData, setData);

    testLogger.testStep('running updater with patches for a and c');
    await updater({ a: { foo: 42 }, c: { baz: 99 } });

    testLogger.testStep('asserting setData was called once');
    expect(setData).toHaveBeenCalledTimes(1);
    testLogger.assertion('setData called once');

    testLogger.testStep('verifying updatedState contents');
    const newMap = updatedState.instances;
    expect(newMap).toMatchObject({
      a: { foo: 42, last_update: 1234 },
      b: { bar: 2, last_update: 0 },
      c: { baz: 99, last_update: 1234 },
    });
    testLogger.assertion('newMap keys and values correct');

    testLogger.testStep('checking placeholder warning for c');
    expect(console.warn).toHaveBeenCalledWith(
      '[updateInstanceDetails] "c" missing – creating placeholder'
    );
    testLogger.assertion('placeholder warning logged');

    testLogger.testStep('asserting IndexedDB persistence calls');
    expect(db.putBatchedPokemonUpdates).toHaveBeenCalledTimes(2);
    expect(db.putBatchedPokemonUpdates).toHaveBeenCalledWith('a', newMap.a);
    expect(db.putBatchedPokemonUpdates).toHaveBeenCalledWith('c', newMap.c);
    testLogger.assertion('putBatchedPokemonUpdates called for a and c');

    testLogger.testStep('asserting localStorage and SW sync');
    expect(localStorage.setItem).toHaveBeenCalledWith('ownershipTimestamp', '1234');
    const swReady = (navigator as any).serviceWorker.ready as Promise<ServiceWorkerRegistration>;
    await swReady;
    testLogger.assertion('serviceWorker.ready eventually resolves');

    testLogger.suiteComplete();
  });

  it('applies a shared patch to a single key', async () => {
    testLogger.suiteStart('applies a shared patch to a single key');

    testLogger.testStep('creating updater');
    const updater = updateInstanceDetails(initialData, setData);

    testLogger.testStep('running updater with patch for a');
    await updater('a', { foo: 100 });

    testLogger.testStep('verifying updatedState.a');
    const newMap = updatedState.instances;
    expect(newMap.a).toMatchObject({ foo: 100, last_update: 1234 });
    testLogger.assertion('newMap.a patched correctly');

    testLogger.testStep('asserting single IndexedDB call');
    expect(db.putBatchedPokemonUpdates).toHaveBeenCalledTimes(1);
    expect(db.putBatchedPokemonUpdates).toHaveBeenCalledWith('a', newMap.a);
    testLogger.assertion('one putBatchedPokemonUpdates call');

    testLogger.suiteComplete();
  });

  it('applies a shared patch to multiple keys', async () => {
    testLogger.suiteStart('applies a shared patch to multiple keys');

    testLogger.testStep('creating updater');
    const updater = updateInstanceDetails(initialData, setData);

    testLogger.testStep('running updater with patch for [a, b]');
    await updater(['a', 'b'], { bar: 77 });

    testLogger.testStep('verifying both a and b updated');
    const newMap = updatedState.instances;
    expect(newMap.a.bar).toBe(77);
    expect(newMap.b.bar).toBe(77);
    expect(newMap.a.last_update).toBe(1234);
    expect(newMap.b.last_update).toBe(1234);
    testLogger.assertion('both keys patched correctly');

    testLogger.testStep('asserting two IndexedDB calls');
    expect(db.putBatchedPokemonUpdates).toHaveBeenCalledTimes(2);
    testLogger.assertion('two putBatchedPokemonUpdates calls');

    testLogger.suiteComplete();
  });

  it('does not bump last_update or persist if patch is empty', async () => {
    testLogger.suiteStart('empty patch does not trigger updates');

    const updater = updateInstanceDetails(initialData, setData);

    await updater('a', {});

    // Assert that setData was not called
    expect(setData).not.toHaveBeenCalled();

    // Verify initial data remains unchanged
    expect(initialData.instances.a.foo).toBe(1);
    expect(initialData.instances.a.last_update).toBe(0); // Should not update timestamp

    // Assert no DB writes
    expect(db.putBatchedPokemonUpdates).not.toHaveBeenCalled();

    testLogger.suiteComplete();
  });

  it('logs error but continues when one putBatchedPokemonUpdates call fails', async () => {
    testLogger.suiteStart('handle IndexedDB failure gracefully');

    console.error = vi.fn(); // Spy on console.error

    const updater = updateInstanceDetails(initialData, setData);

    // Mock failure on first call
    (db.putBatchedPokemonUpdates as any)
      .mockRejectedValueOnce(new Error('fail a'))
      .mockResolvedValueOnce(undefined);

    await updater({ a: { foo: 42 }, b: { bar: 88 } });

    // Still calls DB twice
    expect(db.putBatchedPokemonUpdates).toHaveBeenCalledTimes(2);

    // Error logged
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('cache fail for a'),
      expect.any(Error)
    );

    testLogger.suiteComplete();
  });

  it('naturally overwrites duplicate keys before reaching updater', async () => {
    testLogger.suiteStart('natural overwrite behavior in patch map');

    const updater = updateInstanceDetails(initialData, setData);

    const duplicatePatches: Record<string, any> = {};
    duplicatePatches['a'] = { foo: 10 };
    duplicatePatches['a'] = { foo: 20 }; // overwrites

    await updater(duplicatePatches);

    const newMap = updatedState.instances;
    expect(newMap.a.foo).toBe(20); // The last one naturally applies

    testLogger.suiteComplete();
  });
});
