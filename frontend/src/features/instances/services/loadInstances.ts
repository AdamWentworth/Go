// src/features/instances/services/loadInstances.ts

import { getInstancesData, initializeOrUpdateInstancesData } from '../storage/instancesStorage';
import { isDataFresh } from '@/utils/cacheHelpers';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { Instances } from '@/types/instances';

/**
 * Loads Pokémon instances data, either from fresh cache or by initializing/updating.
 *
 * @param variants - Array of Pokémon variants to initialize data for.
 * @param isLoggedIn - Whether the user is authenticated.
 * @returns A promise resolving to the instances data.
 */
export async function loadInstances(
  variants: PokemonVariant[],
  isLoggedIn: boolean
): Promise<Instances> {
  try {
    const ts = Number(localStorage.getItem('ownershipTimestamp') || 0);
    const fresh = ts && isDataFresh(ts);

    let data: Instances;
    if (fresh) {
      data = (await getInstancesData()).data;
    } else {
      const keys = variants.map(v => v.pokemonKey).filter(Boolean) as string[];
      data = await initializeOrUpdateInstancesData(keys, variants);
    }

    return data;
  } catch (err) {
    console.error('[loadInstances] Failed to load instances:', err);
    throw err; // Re-throw to allow caller to handle
  }
}