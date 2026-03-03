// src/features/instances/storage/instancesStorage.ts
import * as idb from '@/db/indexedDB';
import { generateUUID } from '@/utils/PokemonIDUtils';
import { createNewInstanceData } from '../utils/createNewInstanceData';
import { createScopedLogger, loggerInternals } from '@/utils/logger';
import {
  getStorageNumber,
  setStorageNumber,
  STORAGE_KEYS,
} from '@/utils/storage';

import type { Instances } from '@/types/instances';
import type { PokemonInstance } from '@/types/pokemonInstance';
import type { PokemonVariant } from '@/types/pokemonVariants';

const log = createScopedLogger('instancesStorage');
const canDebugLog = loggerInternals.shouldEmit('debug');

async function yieldToPaint() {
  await new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r())));
}

export async function getInstancesData(): Promise<{
  data: Instances;
  timestamp: number;
}> {
  const data = await idb.getAllInstances<PokemonInstance>();
  const instances: Instances = {};

  data.forEach((item) => {
    if (item.instance_id) {
      instances[item.instance_id] = item;
    } else if (canDebugLog) {
      log.warn('Skipped item without instance_id', item);
    }
  });

  const rawTs = getStorageNumber(STORAGE_KEYS.ownershipTimestamp, 0);
  const timestamp = rawTs > 0 ? rawTs : 0;
  return { data: instances, timestamp };
}

/**
 * Upsert many items; used by initializer flows.
 */
export async function setInstancesData(payload: {
  data: Instances;
  timestamp: number;
}): Promise<void> {
  const t0 = performance.now();
  const items: PokemonInstance[] = Object.entries(payload.data).map(([instance_id, row]) => ({
    ...row,
    instance_id,
  }));

  await idb.putInstancesBulk(items);

  if (canDebugLog) {
    log.debug(`Stored instances into IndexedDB in ${Math.round(performance.now() - t0)} ms`);
  }

  setStorageNumber(STORAGE_KEYS.ownershipTimestamp, payload.timestamp);
}

/**
 * Authoritative REPLACE: clear store, then bulk put full snapshot.
 * Use this right after mergeInstancesData so the cache matches UI exactly.
 * This version writes in chunks and yields between batches to avoid long tasks.
 */
export async function replaceInstancesData(
  data: Instances,
  timestamp: number,
): Promise<void> {
  const t0 = performance.now();
  const db = await idb.initInstancesDB();
  if (!db) return;

  // 1) Clear in its own transaction
  {
    const tx = db.transaction(idb.INSTANCES_STORE, 'readwrite');
    await tx.store.clear();
    await tx.done;
  }

  // 2) Prepare items
  const items: PokemonInstance[] = Object.entries(data).map(([instance_id, row]) => ({
    ...row,
    instance_id,
  }));

  // 3) Write in chunks — a fresh tx per chunk — then yield
  const CHUNK = 500;
  for (let i = 0; i < items.length; i += CHUNK) {
    const slice = items.slice(i, i + CHUNK);

    const tx = db.transaction(idb.INSTANCES_STORE, 'readwrite');
    const store = tx.store;
    for (const item of slice) {
      await store.put(item);
    }
    await tx.done;

    await yieldToPaint();
  }

  if (canDebugLog) {
    log.debug(`[replaceInstancesData] wrote ${items.length} rows in ${Math.round(performance.now() - t0)} ms`);
  }

  setStorageNumber(STORAGE_KEYS.ownershipTimestamp, timestamp);
}

export async function initializeOrUpdateInstancesData(
  _keys: string[], // still passed in, but not required for computation below
  variants: PokemonVariant[],
): Promise<Instances> {
  try {
    const { data: stored } = await getInstancesData();
    if (canDebugLog) {
      log.debug('Parsed instancesData', stored);
    }

    let shouldUpdate = false;

    const existingVariantIds = new Set(
      Object.values(stored)
        .map((entry) => entry.variant_id)
        .filter((variantId): variantId is string => Boolean(variantId))
    );

    const t0 = performance.now();
    variants.forEach((variant) => {
      const vkey = variant.variant_id;
      if (!vkey || existingVariantIds.has(vkey)) return;

      const instance_id = generateUUID();
      const newEntry: PokemonInstance = {
        ...createNewInstanceData(variant),
        instance_id,
        variant_id: vkey,
      };
      stored[instance_id] = newEntry;
      shouldUpdate = true;
    });

    if (canDebugLog) {
      log.debug(`Init/update pass took ${Math.round(performance.now() - t0)} ms`);
    }

    if (shouldUpdate) {
      await setInstancesData({ data: stored, timestamp: Date.now() });
    } else if (canDebugLog) {
      log.debug('No updates required');
    }

    return stored;
  } catch (err) {
    log.error('Failed', err);
    throw new Error('Failed to update instances data');
  }
}
