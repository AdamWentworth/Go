// tests/instances/integration/useInstancesStore.updateInstanceDetails.integration.test.ts

import { act } from '@testing-library/react';
import { describe, it, beforeEach, beforeAll, afterAll, expect } from 'vitest';
import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { useLiveInstances } from '../utils/liveInstancesCache';
import { enableLogging, testLogger } from '../setupTests';

describe('🏪 useInstancesStore.updateInstanceDetails()', () => {
  beforeAll(() => {
    enableLogging('verbose');
    testLogger.fileStart('Store Tests');
    testLogger.suiteStart('useInstancesStore.updateInstanceDetails Integration');
  });

  afterAll(() => {
    testLogger.suiteComplete();
    testLogger.fileEnd();
  });

  let instanceId: string;

  beforeEach(async () => {
    testLogger.testStep('Reset store and hydrate a single instance');
    useInstancesStore.setState({ instances: {}, instancesLoading: true });
    const live = await useLiveInstances();
    instanceId = Object.keys(live)[0]!;
    act(() => {
      useInstancesStore.getState().hydrateInstances({ [instanceId]: live[instanceId] });
    });
  });

  it('should apply a single-field patch to one key', async () => {
    testLogger.testStep('Applying single-field patch');
    const periodicSpy = vi.spyOn(useInstancesStore.getState(), 'periodicUpdates');
    await act(async () => {
      await useInstancesStore.getState().updateInstanceDetails(instanceId, { nickname: 'Zubat' });
    });
    expect(periodicSpy).toHaveBeenCalled();
    const inst = useInstancesStore.getState().instances[instanceId] as any;
    expect(inst.nickname).toBe('Zubat');
  });

  it('should apply the same patch to multiple keys', async () => {
    testLogger.testStep('Hydrating and patching multiple keys');
    const live = await useLiveInstances();
    const ids = Object.keys(live).slice(0, 2);
    act(() => {
      useInstancesStore.getState().hydrateInstances({
        [ids[0]]: live[ids[0]],
        [ids[1]]: live[ids[1]],
      } as any);
    });

    await act(async () => {
      await useInstancesStore.getState().updateInstanceDetails(ids, { cp: 500 });
    });
    const state = useInstancesStore.getState().instances as any;
    expect(state[ids[0]].cp).toBe(500);
    expect(state[ids[1]].cp).toBe(500);
  });

  it('should apply per-key patch via PatchMap', async () => {
    testLogger.testStep('Applying per-key patch map');
    const live = await useLiveInstances();
    const ids = Object.keys(live).slice(0, 2);
    act(() => {
      useInstancesStore.getState().hydrateInstances({
        [ids[0]]: live[ids[0]],
        [ids[1]]: live[ids[1]],
      } as any);
    });

    const patchMap = {
      [ids[0]]: { cp: 100 },
      [ids[1]]: { nickname: 'Onix' },
    };

    await act(async () => {
      await useInstancesStore.getState().updateInstanceDetails(patchMap);
    });

    const state = useInstancesStore.getState().instances as any;
    expect(state[ids[0]].cp).toBe(100);
    expect(state[ids[1]].nickname).toBe('Onix');
  });
});
