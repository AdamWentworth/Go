// src/features/instances/hooks/useBootstrapInstances.ts

import { useEffect } from 'react';

import { useInstancesStore } from '../store/useInstancesStore';
import { useVariantsStore } from '@/features/variants/store/useVariantsStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { createScopedLogger } from '@/utils/logger';

import { loadInstances } from '../services/loadInstances';
import { checkBatchedUpdates } from '@/stores/BatchedUpdates/checkBatchedUpdates';

const log = createScopedLogger('useBootstrapInstances');

/**
 * Hydrates the instance slice the first time variants are ready.
 * Call once at app root (App.tsx or AppProviders.tsx).
 */
export function useBootstrapInstances() {
  const { instancesLoading } = useInstancesStore(state => state);
  const hydrateInstances = useInstancesStore(s => s.hydrateInstances);

  const { variants, variantsLoading } = useVariantsStore();
  const { isLoggedIn } = useAuthStore();

  useEffect(() => {
    if (variantsLoading || !instancesLoading || variants.length === 0) return;

    (async () => {
      try {
        const data = await loadInstances(variants, isLoggedIn);
        hydrateInstances(data);

        if (isLoggedIn) {
          checkBatchedUpdates(useInstancesStore.getState().periodicUpdates);
        }

        useInstancesStore.setState({ instancesLoading: false });
      } catch (err) {
        log.error('Bootstrap failed:', err);
        useInstancesStore.setState({ instancesLoading: false });
      }
    })();
  }, [variantsLoading, variants, isLoggedIn, instancesLoading, hydrateInstances]);
}
