// src/features/instances/actions/updateInstanceStatus.ts
import { RefObject } from 'react';
import { produce } from 'immer';
import { updatePokemonInstanceStatus } from '../services/updatePokemonInstanceStatus';
import { putBatchedPokemonUpdates, putInstancesBulk } from '@/db/indexedDB';
import { createScopedLogger } from '@/utils/logger';
import type { PokemonInstance } from '@/types/pokemonInstance';
import type { InstanceStatus, Instances } from '@/types/instances';
import { PokemonVariant } from '@/types/pokemonVariants';

type AppState = {
  variants: PokemonVariant[];
  instances: Instances;
};

const log = createScopedLogger('updateInstanceStatus');

async function yieldToPaint() {
  await new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r())));
}

export const updateInstanceStatus =
  (
    data: AppState,
    setData: (updater: (prev: AppState) => AppState) => AppState,
    instancesDataRef: RefObject<Instances>,
  ) =>
  async (instanceIds: string | string[], newStatus: InstanceStatus): Promise<void> => {
    const keys = Array.isArray(instanceIds) ? instanceIds : [instanceIds];
    const timestamp = Date.now();

    const changedKeys = new Set<string>();

    const tempData = produce(instancesDataRef.current, draft => {
      for (const target of keys) {
        const resolvedId = updatePokemonInstanceStatus(
          target, newStatus, (data as any).variants, draft as any
        );
        if (!resolvedId) continue;

        const original = (instancesDataRef.current as any)[resolvedId];
        const updated  = (draft as any)[resolvedId];
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
      const row = (tempData as any)[k];
      if (row) beforePruneSnapshot.set(k, { ...(row as PokemonInstance) });
    }

    // Commit
    setData(prev => ({ ...prev, instances: tempData as any }));
    instancesDataRef.current = tempData as any;

    // Prune redundant placeholders of same variant_id by scanning only once
    const prunedKeys = new Set<string>();
    const finalData = produce(tempData, draft => {
      // Build quick index of variant_id -> ids for targeted scans
      const byVariant: Record<string, string[]> = {};
      for (const id of Object.keys(draft as any)) {
        const v = (draft as any)[id]?.variant_id;
        if (!v) continue;
        (byVariant[v] ||= []).push(id);
      }

      const isPlaceholder = (entry: any) =>
        !!entry && !entry.registered && !entry.is_caught && !entry.is_for_trade && !entry.is_wanted;

      for (const id of Object.keys(draft as any)) {
        const entry = (draft as any)[id];
        if (!isPlaceholder(entry)) continue;

        const variantKey = entry.variant_id;
        if (!variantKey) continue;

        const siblings = byVariant[variantKey] || [];
        const hasSibling = siblings.some(otherId => otherId !== id);

        if (hasSibling) {
          prunedKeys.add(id);
          delete (draft as any)[id];
        }
      }
    });

    setData(prev => ({ ...prev, instances: finalData as any }));
    instancesDataRef.current = finalData as any;

    // Build updates maps (changed + pruned)
    const updates = new Map<string, any>();
    for (const id of changedKeys) {
      const updated = (finalData as any)[id];
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

    // Give the browser a frame to paint before IO
    await yieldToPaint();

    // Local cache: write only updated/pruned keys
    try {
      const items: PokemonInstance[] = [];
      for (const [id, value] of updates) {
        items.push({ ...(value as PokemonInstance), instance_id: id });
      }
      if (items.length) await putInstancesBulk(items);
    } catch (err) {
      log.error('instancesDB write failed:', err);
    }

    // Timestamp for freshness checks
    localStorage.setItem('ownershipTimestamp', String(timestamp));

    // Queue to updatesDB; SW will batch-send to backend
    try {
      const promises: Array<Promise<unknown>> = [];
      for (const [id, value] of updates) {
        promises.push(putBatchedPokemonUpdates(id, value));
      }
      if (promises.length) await Promise.all(promises);
    } catch (err) {
      log.error('updatesDB write failed:', err);
    }
  };
