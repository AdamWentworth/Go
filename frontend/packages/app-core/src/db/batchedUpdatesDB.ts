// db/batchedUpdatesDB.ts

import { initUpdatesDB } from './init';
import {
  BATCHED_POKEMON_UPDATES_STORE,
  BATCHED_TRADE_UPDATES_STORE,
} from './constants';
import type {
  ReceiverPokemonUpdate,
  ReceiverTradeUpdate,
} from '@shared-contracts/receiver';

type PokemonUpdateData = Partial<ReceiverPokemonUpdate>;
type TradeUpdateData = Partial<ReceiverTradeUpdate>;

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

export async function getBatchedTradeUpdates(): Promise<ReceiverTradeUpdate[]> {
  const db = await initUpdatesDB();
  if (!db) return [];
  return db.getAll(BATCHED_TRADE_UPDATES_STORE);
}

export async function putBatchedTradeUpdates(
  tradeId: string,
  updateData: TradeUpdateData
): Promise<void> {
  const db = await initUpdatesDB();
  if (!db) return;
  const nestedTradeId =
    typeof updateData.tradeData?.trade_id === 'string'
      ? updateData.tradeData.trade_id
      : undefined;
  await db.put(BATCHED_TRADE_UPDATES_STORE, {
    ...updateData,
    trade_id: updateData.trade_id ?? nestedTradeId ?? tradeId,
  });
}

export async function clearBatchedTradeUpdates(): Promise<void> {
  const db = await initUpdatesDB();
  if (!db) return;
  await db.clear(BATCHED_TRADE_UPDATES_STORE);
}
