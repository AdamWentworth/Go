// db/tradesDB.ts

import { initTradesDB } from './init';
import { POKEMON_TRADES_STORE } from './constants';
import { createScopedLogger } from '@/utils/logger';

const log = createScopedLogger('tradesDB');

// Define the structure of a trade entry
export interface TradeEntry {
  pokemon_instance_id_user_proposed: string;
  pokemon_instance_id_user_accepting: string;
  [key: string]: unknown; // For additional dynamic properties if needed
}

export async function getTradeByPokemonPair(
  proposedId: string,
  acceptingId: string
): Promise<TradeEntry | null> {
  const db = await initTradesDB();
  if (!db) return null;
  const tx = db.transaction(POKEMON_TRADES_STORE, 'readonly');
  const store = tx.objectStore(POKEMON_TRADES_STORE);
  const allTrades: TradeEntry[] = await store.getAll();
  await tx.done;

  return (
    allTrades.find(
      (trade) =>
        (trade.pokemon_instance_id_user_proposed === proposedId &&
          trade.pokemon_instance_id_user_accepting === acceptingId) ||
        (trade.pokemon_instance_id_user_proposed === acceptingId &&
          trade.pokemon_instance_id_user_accepting === proposedId)
    ) || null
  );
}

export async function getAllFromTradesDB(storeName: string): Promise<TradeEntry[]> {
  const db = await initTradesDB();
  if (!db) {
    log.warn(`TradesDB not available; cannot read from '${storeName}'.`);
    return [];
  }

  const tx = db.transaction(storeName, 'readonly');
  const store = tx.objectStore(storeName);
  const allData: TradeEntry[] = await store.getAll();
  await tx.done;

  try {
    const allDataSize: number = new Blob([JSON.stringify(allData)]).size;
    log.debug(
      `getAllFromTradesDB: Retrieved ${allData.length} items from '${storeName}' (approx size: ${allDataSize} bytes)`
    );
  } catch (err) {
    log.debug(`Error measuring size in getAllFromTradesDB for store '${storeName}':`, err);
  }

  return allData;
}

export async function setTradesinDB(storeName: string, dataArray: TradeEntry[]): Promise<void> {
  const db = await initTradesDB();
  if (!db) {
    log.warn(`TradesDB not available; cannot set data in '${storeName}'.`);
    return;
  }

  try {
    const totalDataSize: number = new Blob([JSON.stringify(dataArray)]).size;
    log.debug(
      `setTradesinDB: Storing ${dataArray.length} items in '${storeName}', size: ${totalDataSize} bytes`
    );
  } catch (err) {
    log.debug('Error measuring size in setTradesinDB:', err);
  }

  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  for (const data of dataArray) {
    store.put(data);
  }
  await tx.done;
}

export async function deleteFromTradesDB(storeName: string, key: string): Promise<void> {
  const db = await initTradesDB();
  if (!db) return;

  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  await store.delete(key);
  await tx.done;
}

export async function clearTradesStore(storeName: string): Promise<void> {
  const db = await initTradesDB();
  if (!db) return;

  await db.clear(storeName);
}
