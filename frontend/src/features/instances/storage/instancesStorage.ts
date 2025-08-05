// src/features/instances/storage/instancesStorage.ts
import * as idb from '@/db/indexedDB';
import { generateUUID } from '@/utils/PokemonIDUtils';
import { createNewInstanceData } from '../utils/createNewInstanceData';

import type { Instances } from '@/types/instances';
import type { PokemonInstance } from '@/types/pokemonInstance';
import type { PokemonVariant } from '@/types/pokemonVariants';

export async function getInstancesData(): Promise<{
  data: Instances;
  timestamp: number;
}> {
  const data = await idb.getAllInstances<PokemonInstance>();
  const instances: Instances = {};

  (data as PokemonInstance[]).forEach((item) => {
    if (item.instance_id) {
      instances[item.instance_id] = item;
    } else if (process.env.NODE_ENV === 'development') {
      console.warn('[getInstancesData] Skipped item without instance_id:', item);
    }
  });

  const rawTs = parseInt(localStorage.getItem('ownershipTimestamp') || '0', 10);
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
  const items = Object.keys(payload.data).map((instance_id) => ({
    ...payload.data[instance_id],
    instance_id,
  })) as PokemonInstance[];

  await idb.putInstancesBulk(items);

  if (process.env.NODE_ENV === 'development') {
    console.log(`Stored instances into IndexedDB in ${Math.round(performance.now() - t0)} ms`);
  }

  localStorage.setItem('ownershipTimestamp', payload.timestamp.toString());
}

/**
 * Authoritative REPLACE: clear store, then bulk put full snapshot.
 * Use this right after mergeInstancesData so the cache matches UI exactly.
 */
export async function replaceInstancesData(
  data: Instances,
  timestamp: number,
): Promise<void> {
  const t0 = performance.now();
  const db = await idb.initInstancesDB();
  if (!db) return;

  const tx = db.transaction(idb.INSTANCES_STORE, 'readwrite');
  await tx.store.clear();

  const items = Object.entries(data).map(([instance_id, row]) => ({
    ...row,
    instance_id,
  })) as PokemonInstance[];

  for (const item of items) {
    await tx.store.put(item);
  }
  await tx.done;

  if (process.env.NODE_ENV === 'development') {
    console.log(`[replaceInstancesData] wrote ${items.length} rows in ${Math.round(performance.now() - t0)} ms`);
  }

  localStorage.setItem('ownershipTimestamp', String(timestamp));
}

export async function initializeOrUpdateInstancesData(
  keys: string[],
  variants: PokemonVariant[],
): Promise<Instances> {
  try {
    const { data: stored } = await getInstancesData();
    if (process.env.NODE_ENV === 'development') {
      console.log('[instancesStorage] Parsed instancesData:', stored);
    }

    let shouldUpdate = false;

    const existingVariantIds = new Set(
      Object.values(stored)
        .map(v => v?.variant_id)
        .filter((v): v is string => !!v)
    );

    const t0 = performance.now();
    variants.forEach((variant) => {
      const vkey = variant.pokemonKey;
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

    if (process.env.NODE_ENV === 'development') {
      console.log(`[instancesStorage] Init/update pass took ${Math.round(performance.now() - t0)} ms`);
    }

    if (shouldUpdate) {
      await setInstancesData({ data: stored, timestamp: Date.now() });
    } else if (process.env.NODE_ENV === 'development') {
      console.log('[instancesStorage] No updates required.');
    }

    return stored;
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[instancesStorage] Failed:', err);
    }
    throw new Error('Failed to update instances data');
  }
}
