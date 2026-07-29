// db/batchedUpdatesDB.ts

import { initUpdatesDB } from './init';
import {
  ACKNOWLEDGED_POKEMON_UPDATES_STORE,
  BATCHED_POKEMON_UPDATES_STORE,
} from './constants';
import type { ReceiverPokemonUpdate } from '@shared-contracts/receiver';

type PokemonUpdateData = Partial<ReceiverPokemonUpdate>;

export async function getBatchedPokemonUpdates(): Promise<ReceiverPokemonUpdate[]> {
  const db = await initUpdatesDB();
  if (!db) return [];
  return db.getAll(BATCHED_POKEMON_UPDATES_STORE);
}

export async function putBatchedPokemonUpdates(
  instanceId: string,
  updateData: PokemonUpdateData
): Promise<void> {
  const db = await initUpdatesDB();
  if (!db) return;
  await db.put(BATCHED_POKEMON_UPDATES_STORE, {
    ...updateData,
    instance_id: updateData.instance_id ?? instanceId,
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('pokemon-sync-queue-changed'));
  }
}

export async function clearBatchedPokemonUpdates(): Promise<void> {
  const db = await initUpdatesDB();
  if (!db) return;
  await db.clear(BATCHED_POKEMON_UPDATES_STORE);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('pokemon-sync-queue-changed'));
  }
}

export async function clearAcknowledgedPokemonUpdates(): Promise<void> {
  const db = await initUpdatesDB();
  if (!db) return;
  await db.clear(ACKNOWLEDGED_POKEMON_UPDATES_STORE);
}

export async function getAcknowledgedPokemonUpdates(): Promise<ReceiverPokemonUpdate[]> {
  const db = await initUpdatesDB();
  if (!db) return [];
  return db.getAll(ACKNOWLEDGED_POKEMON_UPDATES_STORE);
}

export async function deleteAcknowledgedPokemonUpdates(instanceIds: string[]): Promise<void> {
  if (!instanceIds.length) return;
  const db = await initUpdatesDB();
  if (!db) return;
  const tx = db.transaction(ACKNOWLEDGED_POKEMON_UPDATES_STORE, 'readwrite');
  await Promise.all(instanceIds.map((instanceId) => tx.store.delete(instanceId)));
  await tx.done;
}
