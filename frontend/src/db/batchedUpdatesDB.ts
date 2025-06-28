// db/batchedUpdatesDB.ts

import { initUpdatesDB } from './init';
import {
  BATCHED_POKEMON_UPDATES_STORE,
  BATCHED_TRADE_UPDATES_STORE,
} from './constants';

interface BatchedUpdate {
  key: string;
  [field: string]: unknown;
}

export async function getBatchedPokemonUpdates(): Promise<BatchedUpdate[]> {
  const db = await initUpdatesDB();
  if (!db) return [];
  return db.getAll(BATCHED_POKEMON_UPDATES_STORE);
}

export async function putBatchedPokemonUpdates(
  key: string,
  updateData: Omit<BatchedUpdate, 'key'>
): Promise<void> {
  const db = await initUpdatesDB();
  if (!db) return;
  await db.put(BATCHED_POKEMON_UPDATES_STORE, { key, ...updateData });
}

export async function clearBatchedPokemonUpdates(): Promise<void> {
  const db = await initUpdatesDB();
  if (!db) return;
  await db.clear(BATCHED_POKEMON_UPDATES_STORE);
}

export async function getBatchedTradeUpdates(): Promise<BatchedUpdate[]> {
  const db = await initUpdatesDB();
  if (!db) return [];
  return db.getAll(BATCHED_TRADE_UPDATES_STORE);
}

export async function putBatchedTradeUpdates(
  key: string,
  updateData: Omit<BatchedUpdate, 'key'>
): Promise<void> {
  const db = await initUpdatesDB();
  if (!db) return;
  await db.put(BATCHED_TRADE_UPDATES_STORE, { key, ...updateData });
}

export async function clearBatchedTradeUpdates(): Promise<void> {
  const db = await initUpdatesDB();
  if (!db) return;
  await db.clear(BATCHED_TRADE_UPDATES_STORE);
}
