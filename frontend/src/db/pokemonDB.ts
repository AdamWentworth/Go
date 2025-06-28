// db/pokemonDB.ts

import { IDBPDatabase } from 'idb';
import { initDB } from './init';
import { isIOS } from './constants';

// You can create a generic type for data stored in the DB
export interface DBRecord {
  [key: string]: unknown;
}

export async function getFromDB<T = DBRecord>(storeName: string, key: string): Promise<T | null> {
  const db = await initDB();
  if (!db) return null;
  return db.get(storeName, key);
}

export async function putIntoDB<T = DBRecord>(storeName: string, data: T): Promise<void> {
  const db = await initDB();
  if (!db) return;
  await db.put(storeName, data);
}

export async function putBulkIntoDB<T = DBRecord>(storeName: string, dataArray: T[]): Promise<void> {
  const db = await initDB();
  if (!db) {
    console.warn("IndexedDB not available; cannot write data.");
    return;
  }

  try {
    const totalDataSize: number = new Blob([JSON.stringify(dataArray)]).size;
    console.log(
      `putBulkIntoDB: Attempting to store ${dataArray.length} items in ${storeName}, total size: ${totalDataSize} bytes`
    );
  } catch (err) {
    console.log('Error measuring size in putBulkIntoDB:', err);
  }

  if (isIOS) {
    const chunkSize: number = 100;
    console.log(`[iOS] Using chunked transactions of size ${chunkSize}`);
    for (let i = 0; i < dataArray.length; i += chunkSize) {
      const chunk: T[] = dataArray.slice(i, i + chunkSize);
      // Now passing the db which is of type IDBPDatabase<IndexedDBObject>
      await putChunk<T>(db, storeName, chunk);
    }
  } else {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    for (const data of dataArray) {
      store.put(data);
    }
    await tx.done;
  }
  console.log(`putBulkIntoDB completed for store ${storeName}`);
}

// Change the database type from unknown to IndexedDBObject
async function putChunk<T = DBRecord>(
  db: IDBPDatabase<DBRecord>, 
  storeName: string, 
  chunk: T[]
): Promise<void> {
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  for (const data of chunk) {
    await store.put(data);
  }
  await tx.done;
}

export async function getAllFromDB<T = DBRecord>(storeName: string): Promise<T[]> {
  const db = await initDB();
  if (!db) {
    console.warn("IndexedDB not available; cannot read data.");
    return [];
  }

  if (isIOS) {
    // Similarly update this to use the matching DB schema type
    return await getDataInChunks<T>(db, storeName);
  } else {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const allData: T[] = await store.getAll();
    await tx.done;
    try {
      const allDataSize: number = new Blob([JSON.stringify(allData)]).size;
      console.log(
        `getAllFromDB: Retrieved ${allData.length} items from '${storeName}' (approx size: ${allDataSize} bytes)`
      );
    } catch (err) {
      console.log(`Error measuring size in getAllFromDB for store '${storeName}':`, err);
    }
    return allData;
  }
}

async function getDataInChunks<T = DBRecord>(
  db: IDBPDatabase<DBRecord>, 
  storeName: string, 
  batchSize: number = 100
): Promise<T[]> {
  const tx = db.transaction(storeName, 'readonly');
  const store = tx.objectStore(storeName);
  const allKeys: IDBValidKey[] = await store.getAllKeys();
  const results: T[] = [];
  for (let i = 0; i < allKeys.length; i += batchSize) {
    const batchKeys = allKeys.slice(i, i + batchSize);
    for (const key of batchKeys) {
      const value = await store.get(key);
      if (value !== undefined) results.push(value as T);
    }
  }
  return results;
}

export async function clearStore(storeName: string): Promise<void> {
  const db = await initDB();
  if (!db) return;
  await db.clear(storeName);
}

export async function deleteFromDB(storeName: string, key: IDBValidKey): Promise<void> {
  const db = await initDB();
  if (!db) return;
  await db.delete(storeName, key);
}
