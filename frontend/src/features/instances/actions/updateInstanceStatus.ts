// src/features/instances/actions/updateInstanceStatus.ts
import { RefObject } from 'react';
import { produce } from 'immer';
import { updatePokemonInstanceStatus } from '../services/updatePokemonInstanceStatus';
import { putBatchedPokemonUpdates, putInstancesBulk } from '@/db/indexedDB';
import type { PokemonInstance } from '@/types/pokemonInstance';
import type { InstanceStatus, Instances } from '@/types/instances';
import { PokemonVariant } from '@/types/pokemonVariants';

type AppState = {
  variants: PokemonVariant[];
  instances: Instances;
};

export const updateInstanceStatus =
  (
    data: AppState,
    setData: (updater: (prev: AppState) => AppState) => AppState,
    instancesDataRef: RefObject<Instances>,
  ) =>
  async (pokemonKeys: string | string[], newStatus: InstanceStatus): Promise<void> => {
    const keys = Array.isArray(pokemonKeys) ? pokemonKeys : [pokemonKeys];
    const timestamp = Date.now();

    const changedKeys = new Set<string>();

    const tempData = produce(instancesDataRef.current, draft => {
      for (const target of keys) {
        const resolvedId = updatePokemonInstanceStatus(
          target, newStatus, data.variants, draft
        );
        if (!resolvedId) continue;

        const original = instancesDataRef.current[resolvedId];
        const updated  = draft[resolvedId];
        const hasChanges =
          !original ||
          Object.keys(updated).some(
            k => (updated as any)[k] !== (original as any)[k] ||
                 !Object.prototype.hasOwnProperty.call(original, k)
          );

        if (hasChanges) changedKeys.add(resolvedId);
      }
    });

    // Snapshot before prune
    const beforePruneSnapshot = new Map<string, PokemonInstance>();
    for (const k of changedKeys) {
      const row = tempData[k];
      if (row) beforePruneSnapshot.set(k, { ...(row as PokemonInstance) });
    }

    // Commit and prune redundant placeholders of same variant_id:
    setData(prev => ({ ...prev, instances: tempData }));
    instancesDataRef.current = tempData;

    const prunedKeys = new Set<string>();
    const finalData = produce(tempData, draft => {
      for (const id of Object.keys(draft)) {
        const entry = draft[id];
        if (!entry) continue;

        const isPlaceholder =
          !entry.registered &&
          !entry.is_caught &&
          !entry.is_for_trade &&
          !entry.is_wanted;

        if (!isPlaceholder) continue;

        const variantKey = entry.variant_id;
        if (!variantKey) continue;

        const hasSibling = Object.keys(draft).some(otherId => {
          if (otherId === id) return false;
          const other = draft[otherId];
          return !!other && other.variant_id === variantKey;
        });

        if (hasSibling) {
          prunedKeys.add(id);
          delete draft[id];
        }
      }
    });

    setData(prev => ({ ...prev, instances: finalData }));
    instancesDataRef.current = finalData;

    // Build updates maps (changed + pruned)
    const updates = new Map<string, any>();
    for (const id of changedKeys) {
      const updated = finalData[id];
      if (updated) {
        updates.set(id, { ...updated, last_update: timestamp });
      } else if (prunedKeys.has(id)) {
        const snapshot = beforePruneSnapshot.get(id) || ({} as Partial<PokemonInstance>);
        const fullPayload = {
          ...snapshot,
          key: id,
          instance_id: id,
          is_caught: false,
          is_for_trade: false,
          is_wanted: false,
          registered: false,
          last_update: timestamp,
        };
        updates.set(id, fullPayload);
      }
    }

    // Local cache: write only updated/pruned keys
    try {
      const items: PokemonInstance[] = [];
      for (const [id, value] of updates) {
        items.push({ ...(value as PokemonInstance), instance_id: id });
      }
      if (items.length) await putInstancesBulk(items);
    } catch (err) {
      console.error('[updateInstanceStatus] instancesDB write failed:', err);
    }

    // Timestamp for freshness checks
    localStorage.setItem('ownershipTimestamp', String(timestamp));

    // Queue to updatesDB; SW will batch-send to backend
    try {
      for (const [id, value] of updates) {
        await putBatchedPokemonUpdates(id, value);
      }
    } catch (err) {
      console.error('[updateInstanceStatus] updatesDB write failed:', err);
    }
  };
