// tests/instances/integration/useInstancesStore.setInstances.integration.test.ts

import { act } from '@testing-library/react';
import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import type { Instances } from '@/types/instances';
import { enableLogging, testLogger } from '../setupTests';

describe('🏪 useInstancesStore.setInstances()', () => {
  beforeAll(() => {
    enableLogging('verbose');
    testLogger.fileStart('Store Tests');
    testLogger.suiteStart('useInstancesStore.setInstances');
  });

  afterAll(() => {
    testLogger.suiteComplete();
    testLogger.fileEnd();
  });

  beforeEach(() => {
    testLogger.testStep('Resetting store state and clearing storage');
    useInstancesStore.setState({ instances: {}, instancesLoading: true });
    localStorage.clear();
  });

  it('should skip when incoming is empty', () => {
    testLogger.testStep('Incoming data empty scenario');
    useInstancesStore.setState({ instances: { foo: {} as any }, instancesLoading: false });
    const initial = useInstancesStore.getState().instances;
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    act(() => {
      useInstancesStore.getState().setInstances({});
    });

    expect(useInstancesStore.getState().instances).toBe(initial);
    expect(localStorage.getItem('ownershipTimestamp')).toBeUndefined();
    expect(logSpy).toHaveBeenCalledWith('[InstancesStore] ⚠️ No incoming data – skipping set');
    logSpy.mockRestore();
  });

  it('should skip when incoming matches existing', async () => {
    testLogger.testStep('Incoming matches existing data scenario');
    const data: Instances = { x: { instance_id: 'x', username: 'testuser' } as any };
    await act(async () => {
      useInstancesStore.getState().hydrateInstances(data);
    });
    const timestampBefore = localStorage.getItem('ownershipTimestamp');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    act(() => {
      useInstancesStore.getState().setInstances(data);
    });

    expect(localStorage.getItem('ownershipTimestamp')).toBe(timestampBefore);
    expect(logSpy).toHaveBeenCalledWith('[InstancesStore] 💤 No changes – incoming data matches current');
    logSpy.mockRestore();
  });

  it('should handle service worker failure gracefully', async () => {
    testLogger.testStep('Service Worker failure scenario');
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        ready: Promise.reject(new Error('Service Worker failure'))
      }
    });

    const payload: Instances = {
      '003_uuid3': { instance_id: '003_uuid3', username: 'testuser', is_unowned: true } as any,
    };

    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await act(async () => {
      useInstancesStore.getState().setInstances(payload);
    });

    expect(useInstancesStore.getState().instances['003_uuid3']).toBeDefined();
    expect(errSpy).toHaveBeenCalledWith(expect.any(Error));
    errSpy.mockRestore();
  });
});
