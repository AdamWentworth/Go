// src/features/instances/services/loadInstances.ts
import { getInstancesData, initializeOrUpdateInstancesData } from '../storage/instancesStorage';
import { isDataFresh } from '@/utils/cacheHelpers';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { Instances } from '@/types/instances';

export async function loadInstances(
  variants: PokemonVariant[],
  isLoggedIn: boolean
): Promise<Instances> {
  try {
    // 1) Always hydrate from cache if anything is there
    const { data: cached } = await getInstancesData();
    const hasCache = !!cached && Object.keys(cached).length > 0;
    if (hasCache) {
      // Optionally (non-blocking) reconcile in the background
      // void initializeOrUpdateInstancesData(variants.map(v => v.pokemonKey).filter(Boolean) as string[], variants)
      //   .catch(err => console.error('[loadInstances] BG reconcile failed:', err));
      return cached;
    }

    // 2) If no cache, fall back to your old freshness logic
    const ts = Number(localStorage.getItem('ownershipTimestamp') || 0);
    const fresh = ts && isDataFresh(ts);
    if (fresh) {
      return cached; // fresh but empty -> fine, return empty
    }

    // 3) First run (or totally stale): initialize
    const keys = variants.map(v => v.pokemonKey).filter(Boolean) as string[];
    const data = await initializeOrUpdateInstancesData(keys, variants);
    return data;
  } catch (err) {
    console.error('[loadInstances] Failed to load instances:', err);
    throw err;
  }
}
