// tests/unit/features/variants/hooks/useBootstrapVariants.unit.test.ts

import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { useBootstrapVariants } from '@/features/variants/hooks/useBootstrapVariants';
import { useVariantsStore } from '@/features/variants/store/useVariantsStore';
import { testLogger, enableLogging } from '../../../../setupTests';

describe('🪝 useBootstrapVariants', () => {
  let mockHydrate: ReturnType<typeof vi.fn>;
  let mockRefresh: ReturnType<typeof vi.fn>;

  beforeAll(() => {
    enableLogging('verbose');
    testLogger.fileStart('useBootstrapVariants.unit.test.ts');
    testLogger.suiteStart('useBootstrapVariants');
  });

  afterAll(() => {
    testLogger.suiteComplete();
    testLogger.fileEnd();
    testLogger.fileSeparator();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockHydrate = vi.fn().mockResolvedValue(undefined);
    mockRefresh = vi.fn();

    vi.spyOn(useVariantsStore, 'getState').mockReturnValue({
      hydrateFromCache: mockHydrate,
      refreshVariants: mockRefresh,
      variants: [],
      pokedexLists: {},
      variantsLoading: false,
      isRefreshing: false,
    });

    testLogger.testStep('Mocks initialized');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    testLogger.testStep('Mocks restored');
  });

  it('calls hydrateFromCache once on mount', () => {
    testLogger.testStep('Render hook to trigger hydrateFromCache');
    renderHook(() => useBootstrapVariants());
    testLogger.assertion('hydrateFromCache should be called once');
    expect(mockHydrate).toHaveBeenCalledTimes(1);
  });

  it('logs error if hydrateFromCache throws', async () => {
    const error = new Error('hydrate failed');
    mockHydrate.mockRejectedValueOnce(error);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    testLogger.testStep('Render hook with failing hydrateFromCache');
    renderHook(() => useBootstrapVariants());
    await Promise.resolve();

    testLogger.assertion('Error should be logged to console.error');
    expect(consoleSpy).toHaveBeenCalledWith('[VariantsStore] Hydrate error:', error);
    consoleSpy.mockRestore();
  });
});
