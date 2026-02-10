// src/features/instances/actions/updateInstanceDetails.ts
import { produce } from 'immer';
import { putBatchedPokemonUpdates, putInstancesBulk } from '@/db/indexedDB';
import type { PokemonInstance } from '@/types/pokemonInstance';
import type { MutableInstances, SetInstancesFn } from '@/types/instances';

type Patch = Partial<PokemonInstance>;
type PatchMap = Record<string, Patch>;

async function yieldToPaint() {
  await new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r())));
}

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

        const existing = (draft as any)[key];
        if (!existing) {
          console.warn('[updateInstanceDetails] "%s" missing – creating placeholder', key);
          (draft as any)[key] = {} as Partial<PokemonInstance>;
        }

        const current = (draft as any)[key] as Record<string, unknown>;
        const hasActualChange = Object.entries(patch).some(
          ([field, value]) => !Object.is(current[field], value)
        );
        if (!hasActualChange) return false;

        (draft as any)[key] = {
          ...current,
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

    // Give the browser a frame to paint before heavy IO
    await yieldToPaint();

    // Local cache: write only changed keys directly to instancesDB
    try {
      const items = updatedKeys.map((id) => ({ ...(newMap as any)[id], instance_id: id })) as PokemonInstance[];
      if (items.length) {
        await putInstancesBulk(items);
      }
    } catch (err) {
      console.error('[updateInstanceDetails] instancesDB write failed:', err);
    }

    // Local timestamp (used by freshness checks)
    localStorage.setItem('ownershipTimestamp', String(timestamp));

    // Queue patches to updatesDB for SW network batching
    try {
      const promises = updatedKeys.map((key) => putBatchedPokemonUpdates(key, (newMap as any)[key]));
      if (promises.length) await Promise.all(promises);
    } catch (err) {
      console.error('[updateInstanceDetails] updatesDB fail:', err);
    }

    // Dev logging
    if (process.env.NODE_ENV === 'development') {
      console.log('[updateInstanceDetails] patches saved', {
        timestamp,
        updatedKeys,
        patches: Object.fromEntries(updatedKeys.map(key => [key, (newMap as any)[key]])),
      });
    }
  };
}
