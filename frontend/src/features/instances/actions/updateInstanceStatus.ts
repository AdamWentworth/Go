// updateInstanceStatus.ts

import { RefObject } from 'react';
import { produce } from 'immer'; // 🛠️
import { updatePokemonInstanceStatus } from '../services/updatePokemonInstanceStatus';
import { putBatchedPokemonUpdates } from '@/db/indexedDB';
import type { PokemonInstance } from '@/types/pokemonInstance';
import type { InstanceStatus, Instances } from '@/types/instances';
import { PokemonVariant } from '@/types/pokemonVariants';

type AppState = {
  variants: PokemonVariant[];
  instances: Instances;
};

/**
 * Update one or many Pokémon instance status flags (Owned ▸ Trade ▸ Wanted…).
 */
export const updateInstanceStatus =
  (
    data: AppState,
    setData: (updater: (prev: AppState) => AppState) => AppState,
    instancesDataRef: RefObject<Instances>,
  ) =>
  async (pokemonKeys: string | string[], newStatus: InstanceStatus): Promise<void> => {
    const keys = Array.isArray(pokemonKeys) ? pokemonKeys : [pokemonKeys];
    const timestamp = Date.now();

    // 1) Apply status changes and record which entries actually changed
    const changedKeys = new Set<string>();
    const tempData = produce(instancesDataRef.current, draft => {
      for (const key of keys) {
        const fullKey = updatePokemonInstanceStatus(key, newStatus, data.variants, draft);
        if (!fullKey) continue;

        const original = instancesDataRef.current[fullKey];
        const updated  = draft[fullKey];
        const hasChanges =
          !original ||
          Object.keys(updated).some(
            k => updated[k] !== original[k] || !original.hasOwnProperty(k)
          );

        if (hasChanges) {
          changedKeys.add(fullKey);
        }
      }
    });

    // 2) Commit immediately to React state (and sync our ref)
    setData(prev => ({ ...prev, instances: tempData }));
    instancesDataRef.current = tempData;

    // 3) Prune redundant unowned rows
    const finalData = produce(tempData, draft => {
      for (const key of keys) {
        const entry = draft[key];
        if (
          entry &&
          entry.is_unowned &&
          !entry.is_owned &&
          !entry.is_for_trade &&
          !entry.is_wanted
        ) {
          const basePrefix = key.split('_').slice(0, -1).join('_');
          const hasSibling = Object.keys(draft).some(k => {
            const prefix = k.split('_').slice(0, -1).join('_');
            return prefix === basePrefix && k !== key;
          });
          if (hasSibling) {
            delete draft[key];
          }
        }
      }
    });

    // 4) Commit pruned data
    setData(prev => ({ ...prev, instances: finalData }));
    instancesDataRef.current = finalData;

    // 5) Build a clean, serializable updates map
    const updates = new Map<string, PokemonInstance>();
    for (const fullKey of changedKeys) {
      // Skip any entries that got pruned away
      const updated = finalData[fullKey];
      if (!updated) continue;

      // `updated` is now a plain object—safe to spread and store
      updates.set(fullKey, { ...updated, last_update: timestamp });
    }

    // 6) Background sync
    try {
      const reg = await navigator.serviceWorker.ready;
      reg.active?.postMessage({
        action: 'syncData',
        data: { data: finalData, timestamp },
      });
      localStorage.setItem('ownershipTimestamp', timestamp.toString());

      // Write each update; all values here are primitives or plain objects
      for (const [key, value] of updates) {
        try {
          await putBatchedPokemonUpdates(key, value);
        } catch (err) {
          console.error(`[updateInstanceStatus] DB write failed for ${key}:`, err);
        }
      }
    } catch (err) {
      console.error('[updateInstanceStatus] SW / IndexedDB sync failed:', err);
    }
  };
