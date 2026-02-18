// src/features/instances/actions/updateInstanceStatus.ts
import { RefObject } from 'react';
import { produce } from 'immer';
import { updatePokemonInstanceStatus } from '../services/updatePokemonInstanceStatus';
import { putBatchedPokemonUpdates, putInstancesBulk } from '@/db/indexedDB';
import { createScopedLogger } from '@/utils/logger';
import { setStorageNumber, STORAGE_KEYS } from '@/utils/storage';
import type { PokemonInstance } from '@/types/pokemonInstance';
import type { InstanceStatus, Instances } from '@/types/instances';
import { PokemonVariant } from '@/types/pokemonVariants';

type AppState = {
  variants: PokemonVariant[];
  instances: Instances;
};

type UpdatePayload = Record<string, unknown>;

const log = createScopedLogger('updateInstanceStatus');

async function yieldToPaint() {
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
}

function hasInstanceChanges(
  original: PokemonInstance | undefined,
  updated: PokemonInstance | undefined,
): boolean {
  if (!updated) return false;
  if (!original) return true;

  return Object.keys(updated).some((key) => {
    const nextValue = updated[key];
    const prevValue = original[key];
    return nextValue !== prevValue || !Object.prototype.hasOwnProperty.call(original, key);
  });
}

function isPlaceholder(entry: PokemonInstance | undefined): boolean {
  return !!entry && !entry.registered && !entry.is_caught && !entry.is_for_trade && !entry.is_wanted;
}

function buildPrunedPlaceholderPayload(
  id: string,
  snapshot: PokemonInstance | undefined,
  timestamp: number,
): UpdatePayload {
  return {
    ...(snapshot ?? {}),
    key: id,
    instance_id: id,
    is_caught: false,
    is_for_trade: false,
    is_wanted: false,
    registered: false,
    last_update: timestamp,
  };
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
    const currentInstances = instancesDataRef.current ?? {};

    const changedKeys = new Set<string>();

    const tempData = produce(currentInstances, (draft: Instances) => {
      for (const target of keys) {
        const resolvedId = updatePokemonInstanceStatus(
          target,
          newStatus,
          data.variants,
          draft,
        );
        if (!resolvedId) continue;

        const original = currentInstances[resolvedId];
        const updated = draft[resolvedId];
        if (hasInstanceChanges(original, updated)) changedKeys.add(resolvedId);
      }
    });

    // Snapshot before prune
    const beforePruneSnapshot = new Map<string, PokemonInstance>();
    for (const k of changedKeys) {
      const row = tempData[k];
      if (row) beforePruneSnapshot.set(k, { ...row });
    }

    // Commit
    setData((prev) => ({ ...prev, instances: tempData }));
    instancesDataRef.current = tempData;

    // Prune redundant placeholders of same variant_id by scanning only once
    const prunedKeys = new Set<string>();
    const finalData = produce(tempData, (draft: Instances) => {
      // Build quick index of variant_id -> ids for targeted scans
      const byVariant: Record<string, string[]> = {};
      for (const id of Object.keys(draft)) {
        const variantId = draft[id]?.variant_id;
        if (!variantId) continue;
        (byVariant[variantId] ||= []).push(id);
      }

      for (const id of Object.keys(draft)) {
        const entry = draft[id];
        if (!isPlaceholder(entry)) continue;

        const variantKey = entry.variant_id;
        if (!variantKey) continue;

        const siblings = byVariant[variantKey] || [];
        const hasSibling = siblings.some((otherId) => otherId !== id);

        if (hasSibling) {
          prunedKeys.add(id);
          delete draft[id];
        }
      }
    });

    setData((prev) => ({ ...prev, instances: finalData }));
    instancesDataRef.current = finalData;

    // Build updates maps (changed + pruned)
    const updates = new Map<string, UpdatePayload>();
    for (const id of changedKeys) {
      const updated = finalData[id];
      if (updated) {
        updates.set(id, { ...updated, last_update: timestamp });
      } else if (prunedKeys.has(id)) {
        updates.set(id, buildPrunedPlaceholderPayload(id, beforePruneSnapshot.get(id), timestamp));
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
    setStorageNumber(STORAGE_KEYS.ownershipTimestamp, timestamp);

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
