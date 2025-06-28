// src/features/variants/hooks/useBootstrapVariants.ts
import { useEffect } from 'react';
import { useVariantsStore } from '@/features/variants/store/useVariantsStore';

export function useBootstrapVariants() {
  useEffect(() => {
    // grab the “real” hydrate function off of the store
    const { hydrateFromCache } = useVariantsStore.getState();

    // fire‑and‑forget, swallow & log errors
    void hydrateFromCache().catch((err: unknown) => {
      console.error('[VariantsStore] Hydrate error:', err);
    });
  }, []); // ← run only once on mount
}
