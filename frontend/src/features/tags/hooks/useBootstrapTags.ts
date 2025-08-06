// src/features/tags/hooks/useBootstrapTags.ts
import { useEffect } from 'react';

import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { useVariantsStore } from '@/features/variants/store/useVariantsStore';
import { useTagsStore } from '../store/useTagsStore';

/**
 * Hook to bootstrap the tags system:
 * 1. Hydrates from cache on initial mount.
 * 2. Rebuilds tags whenever both instances and variants are available.
 */
export function useBootstrapTags() {
  const hydrateFromCache = useTagsStore(state => state.hydrateFromCache);
  const buildTags        = useTagsStore(state => state.buildTags);

  const instances = useInstancesStore(state => state.instances);
  const variants  = useVariantsStore(state => state.variants);

  // Hydrate tags from the cache on mount
  useEffect(() => {
    hydrateFromCache().catch(error => {
      console.error('[useBootstrapTags] Hydration error:', error);
    });
  }, [hydrateFromCache]);

  // Whenever we have both instances and variants, rebuild the tags
  useEffect(() => {
    if (
      instances && Object.keys(instances).length > 0 &&
      variants && variants.length > 0
    ) {
      buildTags().catch(error => {
        console.error('[useBootstrapTags] Build error:', error);
      });
    }
  }, [instances, variants, buildTags]);
}
