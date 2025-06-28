// tests/instances/workflows/liveInstances.workflow.test.ts

import { act } from '@testing-library/react';
import { describe, it, beforeEach, beforeAll, afterAll, expect, vi } from 'vitest';
import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { useVariantsStore } from '@/features/variants/store/useVariantsStore';
import { useAuthStore } from '@/stores/useAuthStore';
import * as idb from '@/db/indexedDB';
import type { Instances } from '@/types/instances';

// Mocks / Utilities
import { useLiveInstances } from '../../utils/liveInstancesCache';
import { useLiveVariants } from '../../utils/liveVariantCache';
import { enableLogging, testLogger } from '../../setupTests';

vi.mock('@/db/indexedDB', async () => {
  const actual = await vi.importActual('@/db/indexedDB');
  return {
    ...actual,
    clearStore: vi.fn(() => Promise.resolve()),
    putIntoDB: vi.fn((storeName: string, data: any) => Promise.resolve()),
    getFromDB: vi.fn((storeName: string) => Promise.resolve({})),
  };
});

describe('🌟 Workflow: Live Instances Cache + Store', () => {
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
    testLogger.testStep('Resetting stores and clearing storage');
    useInstancesStore.setState({ instances: {}, instancesLoading: true });
    useAuthStore.setState({ user: { username: 'testuser', user_id: 'test123', email: 'test@example.com' } as any });
    localStorage.clear();
    await idb.clearStore('instances');

    testLogger.testStep('Loading liveVariants into store');
    const variants = await useLiveVariants();
    useVariantsStore.setState({ variants });

    testLogger.testStep('Loading liveInstances and hydrating store');
    liveInstances = await useLiveInstances();
    instanceKeys = Object.keys(liveInstances);
    await act(async () => {
      await useInstancesStore.getState().hydrateInstances(liveInstances);
    });
  });

  it('hydrates instances correctly from liveInstancesCache', () => {
    testLogger.testStep('Verifying hydration from liveInstancesCache');
    const { instances, instancesLoading } = useInstancesStore.getState();

    expect(instancesLoading).toBe(false);
    expect(Object.keys(instances)).toHaveLength(Object.keys(liveInstances).length);

    for (const key of instanceKeys) {
      expect(instances[key]).toBeDefined();
      expect(instances[key].instance_id).toBe(liveInstances[key].instance_id);
    }
  });

  it('updates instance status after hydration', async () => {
    testLogger.testStep('Updating instance status following hydration');
    const targetId = instanceKeys[0];

    await act(async () => {
      await useInstancesStore.getState().updateInstanceStatus(targetId, 'Owned');
    });

    const updatedInstance = useInstancesStore.getState().instances[targetId];
    expect(updatedInstance.is_owned).toBe(true);
    expect(updatedInstance.is_unowned).toBe(false);
  });

  it('updates instance details after hydration', async () => {
    testLogger.testStep('Updating instance details following hydration');
    const targetId = instanceKeys[0];

    await act(async () => {
      await useInstancesStore.getState().updateInstanceDetails(targetId, { nickname: 'Sparky' });
    });

    const updatedInstance = useInstancesStore.getState().instances[targetId];
    expect(updatedInstance.nickname).toBe('Sparky');
  });

  it('handles multiple updates to instances', async () => {
    testLogger.testStep('Performing multiple updates to instances');
    const ids = instanceKeys.slice(0, 2);

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
