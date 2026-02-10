// tests/instances/integration/useInstancesStore.updateInstanceStatus.integration.test.ts

import { act } from '@testing-library/react';
import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { useLiveInstances } from '../utils/liveInstancesCache';
import { enableLogging, testLogger } from '../setupTests';

describe('🏪 useInstancesStore.updateInstanceStatus()', () => {
  beforeAll(() => {
    enableLogging('verbose');
    testLogger.fileStart('Store Tests');
    testLogger.suiteStart('useInstancesStore.updateInstanceStatus');
  });

  afterAll(() => {
    testLogger.suiteComplete();
    testLogger.fileEnd();
  });

  let instanceId: string;

  beforeEach(async () => {
    testLogger.testStep('Resetting store and hydrating instance');
    useInstancesStore.setState({ instances: {}, instancesLoading: true });
    const live = await useLiveInstances();
    instanceId = Object.keys(live)[0]!;
    act(() => {
      useInstancesStore.getState().hydrateInstances({ [instanceId]: live[instanceId] });
    });
  });

  it('should mark a single instance as Owned', async () => {
    testLogger.testStep('Updating instance status to Owned');
    const periodicSpy = vi.spyOn(useInstancesStore.getState(), 'periodicUpdates');
    await act(async () => {
      await useInstancesStore.getState().updateInstanceStatus(instanceId, 'Owned');
    });
    expect(periodicSpy).toHaveBeenCalled();
    const inst = useInstancesStore.getState().instances[instanceId];
    expect(inst.is_owned).toBe(true);
    expect(inst.is_unowned).toBe(false);
  });

  it('should mark a single instance as Unowned', async () => {
    testLogger.testStep('Updating instance status to Unowned');
    const periodicSpy = vi.spyOn(useInstancesStore.getState(), 'periodicUpdates');
    await act(async () => {
        await useInstancesStore.getState().updateInstanceStatus(instanceId, 'Unowned');
    });
    expect(periodicSpy).toHaveBeenCalled();
    const inst = useInstancesStore.getState().instances[instanceId];
    expect(inst.is_unowned).toBe(true);
    expect(inst.is_owned).toBe(false);
  });

  it('should mark a single instance as Wanted', async () => {
    testLogger.testStep('Updating instance status to Wanted');
    const periodicSpy = vi.spyOn(useInstancesStore.getState(), 'periodicUpdates');
    await act(async () => {
      await useInstancesStore.getState().updateInstanceStatus(instanceId, 'Wanted');
    });
    expect(periodicSpy).toHaveBeenCalled();
    const inst = useInstancesStore.getState().instances[instanceId];
    expect(inst.is_wanted).toBe(true);
    expect(inst.is_for_trade).toBe(false);
  });

  it('should handle multiple keys at once', async () => {
    testLogger.testStep('Updating multiple instance statuses to Owned');
    const live = await useLiveInstances();
    const ids = Object.keys(live).slice(0, 2);
    act(() => {
      useInstancesStore.getState().hydrateInstances({
        [ids[0]]: live[ids[0]],
        [ids[1]]: live[ids[1]],
      });
    });

    const periodicSpy = vi.spyOn(useInstancesStore.getState(), 'periodicUpdates');
    await act(async () => {
      await useInstancesStore.getState().updateInstanceStatus(ids, 'Owned');
    });
    expect(periodicSpy).toHaveBeenCalled();

    const state = useInstancesStore.getState().instances;
    expect(state[ids[0]].is_owned).toBe(true);
    expect(state[ids[1]].is_owned).toBe(true);
  });
});
