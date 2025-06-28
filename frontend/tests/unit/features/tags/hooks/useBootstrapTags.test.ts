// File: tests/hooks/useBootstrapTags.test.ts
import { renderHook, act, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { useBootstrapTags } from '@/features/tags/hooks/useBootstrapTags';
import { useTagsStore } from '@/features/tags/store/useTagsStore';
import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { useVariantsStore } from '@/features/variants/store/useVariantsStore';

import { testLogger, enableLogging } from '../../setupTests';
import type { TagBuckets } from '@/types/tags';

import { useLiveVariants } from '../../utils/liveVariantCache';
import { useLiveInstances } from '../../utils/liveInstancesCache';

describe('🪝 useBootstrapTags', () => {
  let liveVariants: Awaited<ReturnType<typeof useLiveVariants>>;
  let liveInstances: Awaited<ReturnType<typeof useLiveInstances>>;

  beforeAll(async () => {
    liveVariants = await useLiveVariants();
    liveInstances = await useLiveInstances();

    enableLogging('verbose');
    testLogger.fileStart('Hook Tests');
    testLogger.suiteStart('useBootstrapTags');
  });

  afterAll(() => {
    testLogger.suiteComplete();
    testLogger.fileEnd();
    testLogger.fileSeparator();
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    testLogger.suiteStart('reset store state');

    // Seed stores with real data
    useVariantsStore.setState({
      variants: liveVariants,
      variantsLoading: false,
    });
    useInstancesStore.setState({
      instances: liveInstances,
      instancesLoading: false,
    });

    // Reset tags store
    useTagsStore.setState({
      tags: { owned: {}, trade: {}, wanted: {}, unowned: {} } as TagBuckets,
      tagsLoading: true,
      hydrateFromCache: vi.fn().mockResolvedValue(undefined),
      buildTags:        vi.fn().mockResolvedValue(undefined),
    });

    testLogger.suiteComplete();
  });

  // tests/hooks/useBootstrapTags.test.ts
  it('hydrates from cache on mount', async () => {
    // 1. Clear existing timestamps and set ownership newer than lists
    localStorage.setItem('ownershipTimestamp', Date.now().toString());
    localStorage.removeItem('listsTimestamp');
  
    // 2. Create direct reference to original implementation
    const store = useTagsStore.getState();
    const originalHydrate = store.hydrateFromCache;
    
    // 3. Spy on the ACTUAL implementation
    const hydrateSpy = vi.spyOn(store, 'hydrateFromCache')
      .mockImplementation(async () => {
        console.log('[TEST] HydrateFromCache triggered');
        return originalHydrate();
      });
  
    // 4. Render with async act
    await act(async () => {
      renderHook(() => useBootstrapTags());
    });
  
    // 5. Wait with extended timeout
    await waitFor(() => {
      expect(hydrateSpy).toHaveBeenCalledTimes(1);
    }, { timeout: 5000 });
  });
});
