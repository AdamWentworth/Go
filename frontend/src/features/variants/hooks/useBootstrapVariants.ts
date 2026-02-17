// src/features/variants/hooks/useBootstrapVariants.ts
import { useEffect } from 'react';
import { useVariantsStore } from '@/features/variants/store/useVariantsStore';
import { createScopedLogger } from '@/utils/logger';

const log = createScopedLogger('useBootstrapVariants');

export function useBootstrapVariants() {
  useEffect(() => {
    // Grab hydrate function off the store.
    const { hydrateFromCache } = useVariantsStore.getState();

    // Fire-and-forget while logging failures.
    void hydrateFromCache().catch((err: unknown) => {
      log.error('Hydrate error:', err);
    });
  }, []);
}
