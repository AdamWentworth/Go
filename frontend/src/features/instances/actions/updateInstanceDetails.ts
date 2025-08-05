// src/features/instances/actions/updateInstanceDetails.ts
import { produce } from 'immer';
import { putBatchedPokemonUpdates, putInstancesBulk } from '@/db/indexedDB';
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

    // Immutable local map update
    const newMap = produce(data.instances, draft => {
      const apply = (key: string, patch: Patch) => {
        if (!patch || Object.keys(patch).length === 0) return false;

        if (!draft[key]) {
          console.warn(`[updateInstanceDetails] "${key}" missing – creating placeholder`);
          draft[key] = {} as Partial<PokemonInstance>;
        }
        draft[key] = {
          ...draft[key],
          ...patch,
          last_update: timestamp,
        };
        return true;
      };

      const isPatchMap = (input: unknown): input is PatchMap =>
        typeof input === 'object' && input !== null && !Array.isArray(input);

      if (isPatchMap(keyOrKeysOrMap) && maybePatch === undefined) {
        for (const [key, patch] of Object.entries(keyOrKeysOrMap)) {
          if (apply(key, patch)) updatedKeys.push(key);
        }
      } else {
        const keys =
          typeof keyOrKeysOrMap === 'string'
            ? [keyOrKeysOrMap]
            : Array.isArray(keyOrKeysOrMap)
            ? keyOrKeysOrMap
            : [];
        const patch: Patch = maybePatch ?? {};
        for (const key of keys) {
          if (apply(key, patch)) updatedKeys.push(key);
        }
      }
    });

    if (updatedKeys.length === 0) return;

    // Commit to React state
    setData(prev => ({ ...prev, instances: newMap }));

    // Local cache: write only changed keys directly to instancesDB
    try {
      const items = updatedKeys.map((id) => ({ ...newMap[id], instance_id: id })) as PokemonInstance[];
      await putInstancesBulk(items);
    } catch (err) {
      console.error('[updateInstanceDetails] instancesDB write failed:', err);
    }

    // Local timestamp (used by freshness checks)
    localStorage.setItem('ownershipTimestamp', String(timestamp));

    // Queue patches to updatesDB for SW network batching
    for (const key of updatedKeys) {
      try {
        await putBatchedPokemonUpdates(key, newMap[key]);
      } catch (err) {
        console.error(`[updateInstanceDetails] updatesDB fail for ${key}:`, err);
      }
    }

    // Dev logging
    if (process.env.NODE_ENV === 'development') {
      console.log('[updateInstanceDetails] patches saved', {
        timestamp,
        updatedKeys,
        patches: Object.fromEntries(updatedKeys.map(key => [key, newMap[key]])),
      });
    }
  };
}
