// src/features/instances/actions/updateInstanceDetails.ts

import { produce } from 'immer'; // Add Immer import
import { putBatchedPokemonUpdates } from '@/db/indexedDB';
import type { PokemonInstance } from '@/types/pokemonInstance';
import type { MutableInstances, SetInstancesFn } from '@/types/instances';

type Patch = Partial<PokemonInstance>;
type PatchMap = Record<string, Patch>;

/**
 * Updates fields (e.g., IVs, nickname) on one or more Pokémon instances.
 *
 * Overloads:
 * - updater(keyOrKeys: string | string[], patch: Patch): Promise<void>
 * - updater(patchMap: Record<string, Patch>): Promise<void>
 */
export function updateInstanceDetails(
  data: { instances: MutableInstances },
  setData: SetInstancesFn,
): {
  (keyOrKeys: string | string[], patch: Patch): Promise<void>;
  (patchMap: PatchMap): Promise<void>;
} {
  return async (
    keyOrKeysOrMap: string | string[] | PatchMap,
    maybePatch?: Patch,
  ): Promise<void> => {
    const timestamp = Date.now();
    let updatedKeys: string[] = [];

    // Use Immer to create an immutable updated map
    const newMap = produce(data.instances, draft => {
      // Helper to apply a single patch to one key
      const apply = (key: string, patch: Patch) => {
        if (!patch || Object.keys(patch).length === 0) {
          return false; // Return false to indicate no changes
        }

        if (!draft[key]) {
          console.warn(`[updateInstanceDetails] "${key}" missing – creating placeholder`);
          draft[key] = {} as Partial<PokemonInstance>;
        }
        draft[key] = {
          ...draft[key],
          ...patch,
          last_update: timestamp,
        };
        return true; // Return true to indicate changes were applied
      };

      const isPatchMap = (
        input: unknown
      ): input is PatchMap =>
        typeof input === 'object' &&
        input !== null &&
        !Array.isArray(input);

      if (isPatchMap(keyOrKeysOrMap) && maybePatch === undefined) {
        // 1) Full per-key map
        const map = keyOrKeysOrMap;
        for (const [key, patch] of Object.entries(map)) {
          if (apply(key, patch)) {
            updatedKeys.push(key); // Only include keys with actual changes
          }
        }
      } else {
        // 2) One shared patch over one or many keys
        const keys =
          typeof keyOrKeysOrMap === 'string'
            ? [keyOrKeysOrMap]
            : Array.isArray(keyOrKeysOrMap)
            ? keyOrKeysOrMap
            : [];

        const patch: Patch = maybePatch ?? {};
        for (const key of keys) {
          if (apply(key, patch)) {
            updatedKeys.push(key); // Only include keys with actual changes
          }
        }
      }
    });

    // Skip further processing if no keys were updated
    if (updatedKeys.length === 0) {
      return;
    }

    // 3) Commit to React state
    setData(prev => ({
      ...prev,
      instances: newMap,
    }));

    // 4) Try service-worker sync
    try {
      const reg = await navigator.serviceWorker.ready;
      reg.active?.postMessage({
        action: 'syncData',
        data: { data: newMap, timestamp },
      });
    } catch (err) {
      console.error('[updateInstanceDetails] SW sync failed:', err);
    }

    // 5) Update local timestamp
    localStorage.setItem('ownershipTimestamp', String(timestamp));

    // 6) Persist to IndexedDB
    for (const key of updatedKeys) {
      try {
        await putBatchedPokemonUpdates(key, newMap[key]);
      } catch (err) {
        console.error(`[updateInstanceDetails] cache fail for ${key}:`, err);
      }
    }

    // 7) Development-only logging
    if (process.env.NODE_ENV === 'development') {
      console.log('[updateInstanceDetails] patches saved', {
        timestamp,
        updatedKeys,
        patches: Object.fromEntries(
          updatedKeys.map(key => [key, newMap[key]])
        ),
      });
    }
  };
}