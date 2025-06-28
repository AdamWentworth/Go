// tests/hooks/useBootstrapInstances.test.ts
import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useBootstrapInstances } from '@/features/instances/hooks/useBootstrapInstances';
import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { useVariantsStore } from '@/features/variants/store/useVariantsStore';
import { useAuthStore } from '@/stores/useAuthStore';
import * as storage from '@/features/instances/storage/instancesStorage';
import * as cacheHelpers from '@/utils/cacheHelpers';
import * as batched from '@/stores/BatchedUpdates/checkBatchedUpdates';
import { testLogger, enableLogging } from '../../setupTests';
import type { Instances } from '@/types/instances';
import { useLiveVariants } from '../../utils/liveVariantCache';

describe('🪝 useBootstrapInstances', () => {
  beforeAll(() => {
    enableLogging('verbose');
    testLogger.fileStart('Hook Tests');
    testLogger.suiteStart('useBootstrapInstances');
  });

  afterAll(() => {
    testLogger.suiteComplete();
    testLogger.fileEnd();
    testLogger.fileSeparator();
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    testLogger.suiteStart('reset mocks and store');
    useInstancesStore.setState({ instancesLoading: true, instances: {} });
    useVariantsStore.setState({ variants: [], variantsLoading: false });
    useAuthStore.setState({ isLoggedIn: false });
    testLogger.suiteComplete();
  });

  it('hydrates from cache when variants are present and cache is fresh', async () => {
    testLogger.testStep('load live variants and simulate fresh cache');
    const variants = await useLiveVariants();
    useVariantsStore.setState({ variants, variantsLoading: false });
    useInstancesStore.setState({ instancesLoading: true });

    const fakeData = { pika: { last_update: 9 } } as unknown as Instances;
    vi.spyOn(localStorage.__proto__, 'getItem').mockReturnValue('5555');
    vi.spyOn(cacheHelpers, 'isDataFresh').mockReturnValue(true);
    vi.spyOn(storage, 'getInstancesData').mockResolvedValue({ data: fakeData, timestamp: 5555 });

    const hydrateSpy = vi.spyOn(useInstancesStore.getState(), 'hydrateInstances');

    renderHook(() => useBootstrapInstances());
    await act(() => Promise.resolve());

    testLogger.assertion('getInstancesData called');
    expect(storage.getInstancesData).toHaveBeenCalled();

    testLogger.assertion('hydrateInstances called with stubbed data');
    expect(hydrateSpy).toHaveBeenCalledWith(fakeData);

    testLogger.assertion('instancesLoading cleared');
    expect(useInstancesStore.getState().instancesLoading).toBe(false);
  });

  it('does not bootstrap instances when variants are empty', async () => {
    testLogger.testStep('set empty variants and make sure bootstrap is skipped');

    useVariantsStore.setState({ variants: [], variantsLoading: false });
    useInstancesStore.setState({ instancesLoading: true });

    const hydrateSpy = vi.spyOn(useInstancesStore.getState(), 'hydrateInstances');
    const getSpy = vi.spyOn(storage, 'getInstancesData');
    const initSpy = vi.spyOn(storage, 'initializeOrUpdateInstancesData');

    renderHook(() => useBootstrapInstances());
    await act(() => Promise.resolve());

    testLogger.assertion('hydrateInstances should NOT be called');
    expect(hydrateSpy).not.toHaveBeenCalled();
    expect(getSpy).not.toHaveBeenCalled();
    expect(initSpy).not.toHaveBeenCalled();
    expect(useInstancesStore.getState().instancesLoading).toBe(true);
  });

  it('falls back to initializeOrUpdate when timestamp is stale', async () => {
    testLogger.testStep('load live variants');
    const variants = await useLiveVariants();
    useVariantsStore.setState({ variants, variantsLoading: false });
    useInstancesStore.setState({ instancesLoading: true });

    vi.spyOn(localStorage.__proto__, 'getItem').mockReturnValue('0');
    vi.spyOn(cacheHelpers, 'isDataFresh').mockReturnValue(false);

    const fakeData = { bar: { last_update: 2 } } as unknown as Instances;
    vi.spyOn(storage, 'initializeOrUpdateInstancesData').mockResolvedValue(fakeData);

    const hydrateSpy = vi.spyOn(useInstancesStore.getState(), 'hydrateInstances');

    renderHook(() => useBootstrapInstances());
    await act(() => Promise.resolve());

    testLogger.assertion('initializeOrUpdateInstancesData called with variant keys');
    expect(storage.initializeOrUpdateInstancesData).toHaveBeenCalledWith(
      expect.any(Array),
      variants
    );
    expect(hydrateSpy).toHaveBeenCalledWith(fakeData);
    expect(useInstancesStore.getState().instancesLoading).toBe(false);
  });

  it('invokes checkBatchedUpdates when logged in', async () => {
    testLogger.testStep('load live variants and set isLoggedIn true');
    const variants = await useLiveVariants();
    useVariantsStore.setState({ variants, variantsLoading: false });
    useInstancesStore.setState({ instancesLoading: true });
    useAuthStore.setState({ isLoggedIn: true });

    vi.spyOn(localStorage.__proto__, 'getItem').mockReturnValue('1234');
    vi.spyOn(cacheHelpers, 'isDataFresh').mockReturnValue(true);
    vi.spyOn(storage, 'getInstancesData').mockResolvedValue({ data: {} as Instances, timestamp: 1234 });

    const checkSpy = vi.spyOn(batched, 'checkBatchedUpdates');

    renderHook(() => useBootstrapInstances());
    await act(() => Promise.resolve());

    expect(checkSpy).toHaveBeenCalledWith(useInstancesStore.getState().periodicUpdates);
  });

  it('logs and still clears loading on error', async () => {
    testLogger.testStep('load live variants and simulate error');
    const variants = await useLiveVariants();
    useVariantsStore.setState({ variants, variantsLoading: false });
    useInstancesStore.setState({ instancesLoading: true });

    vi.spyOn(localStorage.__proto__, 'getItem').mockReturnValue('1234');
    vi.spyOn(cacheHelpers, 'isDataFresh').mockReturnValue(true);
    const error = new Error('uh-oh');
    vi.spyOn(storage, 'getInstancesData').mockRejectedValue(error);

    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderHook(() => useBootstrapInstances());
    await act(() => Promise.resolve());

    expect(errSpy).toHaveBeenCalledWith('[BootstrapInstances] failed:', error);
    expect(useInstancesStore.getState().instancesLoading).toBe(false);
  });
});
