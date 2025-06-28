// instancesStorage.ts

import * as idb from '@/db/indexedDB';
import { generateUUID, validateUUID } from '@/utils/PokemonIDUtils';
import { createNewInstanceData } from '../utils/createNewInstanceData';

import type { Instances }   from '@/types/instances';
import type { PokemonInstance } from '@/types/pokemonInstance';
import type { PokemonVariant }  from '@/types/pokemonVariants';

/* -------------------------------------------------------------------------- */
/*  Public API                                                                */
/* -------------------------------------------------------------------------- */

export async function getInstancesData(): Promise<{
  data: Instances;
  timestamp: number;
}> {
  const data = await idb.getAllFromDB('pokemonOwnership');
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

export async function setInstancesData(payload: {
  data: Instances;
  timestamp: number;
}): Promise<void> {
  await idb.clearStore('pokemonOwnership');

  const t0 = performance.now();
  const items = Object.keys(payload.data).map((instance_id) => ({
    ...payload.data[instance_id],
    instance_id,
  })) as PokemonInstance[];

  await idb.putBulkIntoDB('pokemonOwnership', items);

  if (process.env.NODE_ENV === 'development') {
    console.log(
      `Stored instances into IndexedDB in ${Math.round(performance.now() - t0)} ms`
    );
  }

  localStorage.setItem('ownershipTimestamp', payload.timestamp.toString());
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
    const existingKeys = new Set(
      Object.keys(stored).map((k) => {
        const parts = k.split('_');
        const maybeUUID = parts.pop()!;
        return validateUUID(maybeUUID) ? parts.join('_') : k;
      }),
    );

    const t0 = performance.now();
    variants.forEach((variant, i) => {
      const baseKey = keys[i];
      if (existingKeys.has(baseKey)) return;

      const fullKey = `${baseKey}_${generateUUID()}`;
      const newEntry: PokemonInstance = {
        ...createNewInstanceData(variant),
        instance_id: fullKey,
      };
      stored[fullKey] = newEntry;
      shouldUpdate = true;
    });

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[instancesStorage] Init/update pass took ${Math.round(performance.now() - t0)} ms`,
      );
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
