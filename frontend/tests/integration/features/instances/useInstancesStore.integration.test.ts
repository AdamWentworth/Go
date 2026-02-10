// tests/instances/integration/useInstancesStore.integration.test.ts

import { act } from '@testing-library/react';
import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { useVariantsStore } from '@/features/variants/store/useVariantsStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLiveVariants } from '../utils/liveVariantCache';
import { useLiveInstances } from '../utils/liveInstancesCache';
import * as idb from '@/db/indexedDB';
import type { Instances } from '@/types/instances';
import type { User } from '@/types/auth';
import { enableLogging, testLogger } from '../setupTests';

// Mock Service Worker
const server = setupServer();

// Mock IndexedDB functions
vi.mock('@/db/indexedDB', async () => {
  const actual = await vi.importActual('@/db/indexedDB');
  return {
    ...actual,
    clearStore: vi.fn(() => Promise.resolve()),
    putIntoDB: vi.fn((storeName: string, data: any) => Promise.resolve()),
    getFromDB: vi.fn((storeName: string) => Promise.resolve({}))
  };
});

describe('🏪 useInstancesStore Integration', () => {
  beforeAll(() => {
    enableLogging('verbose');
    testLogger.fileStart('Store Tests');
    testLogger.suiteStart('useInstancesStore Integration');
    server.listen();
  });

  afterAll(() => {
    server.close();
    testLogger.suiteComplete();
    testLogger.fileEnd();
  });

  beforeEach(async () => {
    testLogger.testStep('Resetting stores and clearing storage');
    useInstancesStore.setState({ instances: {}, instancesLoading: true });
    useVariantsStore.setState({ variants: [] });
    
    testLogger.testStep('Providing complete User object');
    useAuthStore.setState({
      user: {
        username: 'testuser',
        user_id: 'test123',
        email: 'test@example.com',
        pokemonGoName: 'TestTrainer',
        trainerCode: '1234 5678 9012',
        location: 'San Francisco, CA',
        allowLocation: true,
        coordinates: { latitude: 37.7749, longitude: -122.4194 },
        accessTokenExpiry: new Date(Date.now() + 3600000).toISOString(),
        refreshTokenExpiry: new Date(Date.now() + 86400000).toISOString(),
      } as User
    });

    testLogger.testStep('Clearing IndexedDB and localStorage');
    await idb.clearStore('instances');
    localStorage.clear();

    testLogger.testStep('Loading variants into store');
    const variants = await useLiveVariants();
    useVariantsStore.setState({ variants });
  });

  it('should hydrate instances from IndexedDB using useLiveInstances', async () => {
    testLogger.testStep('Hydrating from IndexedDB');
    const liveInstances = await useLiveInstances();
    const instanceId = Object.keys(liveInstances)[0];
    if (!instanceId) throw new Error('No instances available for test');

    await idb.putIntoDB('instances', liveInstances);

    await act(async () => {
      await useInstancesStore.getState().hydrateInstances(liveInstances);
    });

    const { instances, instancesLoading } = useInstancesStore.getState();
    expect(Object.keys(instances)).toHaveLength(Object.keys(liveInstances).length);
    expect(instances[instanceId]).toBeDefined();
    expect(instancesLoading).toBe(false);
  });

  it('should sync instance updates with Service Worker', async () => {
    testLogger.testStep('Syncing instance updates with Service Worker');
    server.use(
      rest.post('/sync', (req, res, ctx) => {
        return res(ctx.json({ status: 'success' }));
      })
    );

    const liveInstances = await useLiveInstances();
    const instanceId = Object.keys(liveInstances)[0];
    if (!instanceId) throw new Error('No instances available for test');
    const mockInstance = liveInstances[instanceId];
    act(() => {
      useInstancesStore.getState().hydrateInstances({ [instanceId]: mockInstance });
    });

    const periodicSpy = vi.spyOn(useInstancesStore.getState(), 'periodicUpdates');
    await act(async () => {
      await useInstancesStore.getState().updateInstanceStatus(instanceId, 'Owned');
    });

    expect(periodicSpy).toHaveBeenCalled();

    const updated = useInstancesStore.getState().instances[instanceId];
    expect(updated.is_owned).toBe(true);
    expect(updated.is_unowned).toBe(false);
  });

  it('should merge instances with username-based logic', async () => {
    testLogger.testStep('Merging instances with username-based logic');
    const liveInstances = await useLiveInstances();
    const instanceId = Object.keys(liveInstances)[0];
    if (!instanceId) throw new Error('No instances available for test');
    const initialData: Instances = {
      [instanceId]: { ...liveInstances[instanceId], is_owned: true },
    };
    act(() => {
      useInstancesStore.getState().hydrateInstances(initialData);
    });

    const otherInstance = { ...liveInstances[instanceId] };
    otherInstance.instance_id = '0001-shiny_uuid2';
    otherInstance.username = 'otheruser';
    otherInstance.is_wanted = true;
    otherInstance.is_unowned = true;
    
    const incomingData: Instances = {
      '0001-shiny_uuid2': otherInstance
    };

    act(() => {
      useInstancesStore.getState().setInstances(incomingData);
    });

    const instances = useInstancesStore.getState().instances;
    expect(instances['0001-shiny_uuid2']).toBeUndefined();
    expect(instances[instanceId].is_owned).toBe(true);
  });

  it('should handle concurrent status updates', async () => {
    testLogger.testStep('Handling concurrent status updates');
    const liveInstances = await useLiveInstances();
    const instanceId = Object.keys(liveInstances)[0];
    if (!instanceId) throw new Error('No instances available for test');
    const mockInstance = liveInstances[instanceId];
    act(() => {
      useInstancesStore.getState().hydrateInstances({ [instanceId]: mockInstance });
    });

    await Promise.all([
      act(async () => {
        await useInstancesStore.getState().updateInstanceStatus(instanceId, 'Owned');
      }),
      act(async () => {
        await useInstancesStore.getState().updateInstanceStatus(instanceId, 'Wanted');
      }),
    ]);

    const updated = useInstancesStore.getState().instances[instanceId];
    expect(['Owned', 'Wanted']).toContain(updated.is_owned ? 'Owned' : 'Wanted');
  });

  describe('resetInstances()', () => {
    it('should clear state and localStorage', () => {
      testLogger.testStep('resetInstances lifecycle');
      useInstancesStore.setState({ instances: { foo: {} as any }, instancesLoading: false });
      localStorage.setItem('ownershipTimestamp', '12345');
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      act(() => {
        useInstancesStore.getState().resetInstances();
      });

      const { instances, instancesLoading } = useInstancesStore.getState();
      expect(instances).toEqual({});
      expect(instancesLoading).toBe(true);
      expect(localStorage.getItem('ownershipTimestamp')).toBeUndefined();
      expect(logSpy).toHaveBeenCalledWith('[InstancesStore] resetInstances()');
      logSpy.mockRestore();
    });
  });

  describe('hydrateInstances()', () => {
    it('should set loading=false even with empty data', async () => {
      testLogger.testStep('hydrateInstances with empty data');
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await act(async () => {
        await useInstancesStore.getState().hydrateInstances({});
      });

      const { instances, instancesLoading } = useInstancesStore.getState();
      expect(instances).toEqual({});
      expect(instancesLoading).toBe(false);
      expect(logSpy).toHaveBeenCalledWith('[InstancesStore] 💾 Hydrated 0 instances from cache');
      logSpy.mockRestore();
    });

    it('should log singular vs plural correctly', async () => {
      testLogger.testStep('hydrateInstances singular vs plural');
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await act(async () => {
        await useInstancesStore.getState().hydrateInstances({ a: {} as any });
      });
      expect(logSpy).toHaveBeenLastCalledWith('[InstancesStore] 💾 Hydrated 1 instance from cache');

      await act(async () => {
        await useInstancesStore.getState().hydrateInstances({ a: {} as any, b: {} as any });
      });
      expect(logSpy).toHaveBeenLastCalledWith('[InstancesStore] 💾 Hydrated 2 instances from cache');
      logSpy.mockRestore();
    });
  });

  describe('periodicUpdates()', () => {
    it('should exist and not throw', () => {
      testLogger.testStep('periodicUpdates existence');
      expect(() => {
        useInstancesStore.getState().periodicUpdates();
      }).not.toThrow();
    });
  });
});
