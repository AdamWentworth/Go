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
 *
 * NOTE: When a release/transfer results in an "unowned-only" instance that gets
 * pruned locally (because a sibling exists), we still enqueue a minimal update
 * with is_unowned=true and the other three flags=false so the backend will drop
 * the instance. This prevents "zombie" rows from coming back on fresh login.
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
            k => updated[k] !== (original as any)[k] || !Object.prototype.hasOwnProperty.call(original, k)
          );

        if (hasChanges) {
          changedKeys.add(fullKey);
        }
      }
    });

    // 1b) Snapshot the changed rows BEFORE pruning — we may need these to send
    // a "tombstone-like" unowned-only update even if we prune the row locally.
    const beforePruneSnapshot = new Map<string, PokemonInstance>();
    for (const k of changedKeys) {
      const row = tempData[k];
      if (row) {
        // Shallow copy is fine; we will override flags later if needed
        beforePruneSnapshot.set(k, { ...(row as PokemonInstance) });
      }
    }

    // 2) Commit immediately to React state (and sync our ref)
    setData(prev => ({ ...prev, instances: tempData }));
    instancesDataRef.current = tempData;

    // 3) Prune redundant unowned rows, but remember which keys we removed
    const prunedKeys = new Set<string>();

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
            prunedKeys.add(key);
            delete draft[key];
          }
        }
      }
    });

    // 4) Commit pruned data
    setData(prev => ({ ...prev, instances: finalData }));
    instancesDataRef.current = finalData;

    // 5) Build a clean, serializable updates map
    //    - If the row still exists in finalData, send the full updated object.
    //    - If it was pruned, send an "unowned-only" update so the backend drops it.
    const updates = new Map<string, any>();

    for (const fullKey of changedKeys) {
      const updated = finalData[fullKey];

      if (updated) {
        // Normal path: row remains, send full updated payload
        updates.set(fullKey, { ...updated, last_update: timestamp });
      } else if (prunedKeys.has(fullKey)) {
        // Use the full before-prune row and force unowned-only flags
        const snapshot = beforePruneSnapshot.get(fullKey) || ({} as Partial<PokemonInstance>);

        const fullPayload = {
          // include EVERYTHING we knew about the instance before pruning
          ...snapshot,

          // make sure identifiers are present/consistent
          key: fullKey,
          instance_id: fullKey,

          // force the four flags so backend drops it
          is_owned: false,
          is_for_trade: false,
          is_wanted: false,
          is_unowned: true,

          last_update: timestamp,
        };

        updates.set(fullKey, fullPayload);

        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log('[BATCH] enqueued unowned-only (pruned, full payload) for', fullKey, fullPayload);
        }
      }
      // else: changedKeys contains a key that neither exists nor was pruned
      // (shouldn't happen in normal flow) → ignore
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
