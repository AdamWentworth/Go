// db/batchedUpdatesDB.ts

import { initUpdatesDB } from './init';
import { BATCHED_POKEMON_UPDATES_STORE } from './constants';
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
}

export async function clearBatchedPokemonUpdates(): Promise<void> {
  const db = await initUpdatesDB();
  if (!db) return;
  await db.clear(BATCHED_POKEMON_UPDATES_STORE);
}
