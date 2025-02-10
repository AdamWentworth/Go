import { openDB } from 'idb';

// -----------------------------------------------------------------------------
// Detect iOS
// -----------------------------------------------------------------------------
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
if (isIOS) {
    console.log(`Detected iOS device: ${isIOS}`);
}
// -----------------------------------------------------------------------------
// Database Names
// -----------------------------------------------------------------------------
const DB_NAME = 'pokemonDB';
const LISTS_DB_NAME = 'pokemonListsDB';
const TRADES_DB_NAME = 'tradesDB';
const UPDATES_DB_NAME = 'batchedUpdatesDB';

// -----------------------------------------------------------------------------
// DB Versions
// -----------------------------------------------------------------------------
const DB_VERSION = 1;

// -----------------------------------------------------------------------------
// Store Names for Main DB (pokemonDB)
// -----------------------------------------------------------------------------
const VARIANTS_STORE = 'pokemonVariants';
export const OWNERSHIP_DATA_STORE = 'pokemonOwnership';

// -----------------------------------------------------------------------------
// Store Names for the Batched Updates DB
// -----------------------------------------------------------------------------
const BATCHED_POKEMON_UPDATES_STORE = 'batchedPokemonUpdates';
const BATCHED_TRADE_UPDATES_STORE = 'batchedTradeUpdates';

// -----------------------------------------------------------------------------
// Store names for listsDB
// -----------------------------------------------------------------------------
const LIST_STORES = ['owned', 'unowned', 'wanted', 'trade'];

// -----------------------------------------------------------------------------
// Trades DB Constants
// -----------------------------------------------------------------------------
const POKEMON_TRADES_STORE = 'pokemonTrades';
const RELATED_INSTANCES_STORE = 'relatedInstances';

// -----------------------------------------------------------------------------
// Enums for trades
// -----------------------------------------------------------------------------
export const TRADE_STATUSES = {
  PROPOSED: 'proposed',
  ACCEPTED: 'accepted',
  DENIED: 'denied',
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const TRADE_FRIENDSHIP_LEVELS = {
  1: 'Good',
  2: 'Great',
  3: 'Ultra',
  4: 'Best',
};

// -----------------------------------------------------------------------------
// Main DB: pokemonDB
// -----------------------------------------------------------------------------
let dbInstance = null;
export async function initDB() {
  // Removed persistent storage request for iOS
  // (If you want to attempt it, you can keep it, but it usually returns false in Safari)

  if (dbInstance) return dbInstance;
  try {
    dbInstance = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(VARIANTS_STORE)) {
          db.createObjectStore(VARIANTS_STORE, { keyPath: 'pokemonKey' });
        }
        if (!db.objectStoreNames.contains(OWNERSHIP_DATA_STORE)) {
          db.createObjectStore(OWNERSHIP_DATA_STORE, { keyPath: 'instance_id' });
        }
      },
    });
  } catch (err) {
    console.error("IndexedDB initialization failed:", err);
    dbInstance = null;
  }
  return dbInstance;
}

// -----------------------------------------------------------------------------
// Lists DB: pokemonListsDB
// -----------------------------------------------------------------------------
let listsDBInstance = null;
export async function initListsDB() {
  if (listsDBInstance) return listsDBInstance;
  try {
    listsDBInstance = await openDB(LISTS_DB_NAME, DB_VERSION, {
      upgrade(db) {
        LIST_STORES.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'instance_id' });
          }
        });
      },
    });
  } catch (err) {
    console.error("ListsDB initialization failed:", err);
    listsDBInstance = null;
  }
  return listsDBInstance;
}

// -----------------------------------------------------------------------------
// Trades DB: tradesDB
// -----------------------------------------------------------------------------
let tradesDBInstance = null;
export async function initTradesDB() {
  if (tradesDBInstance) return tradesDBInstance;
  try {
    tradesDBInstance = await openDB(TRADES_DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(POKEMON_TRADES_STORE)) {
          db.createObjectStore(POKEMON_TRADES_STORE, { keyPath: 'trade_id' });
        }
        if (!db.objectStoreNames.contains(RELATED_INSTANCES_STORE)) {
          db.createObjectStore(RELATED_INSTANCES_STORE, { keyPath: 'instance_id' });
        }
      },
    });
  } catch (err) {
    console.error("TradesDB initialization failed:", err);
    tradesDBInstance = null;
  }
  return tradesDBInstance;
}

// -----------------------------------------------------------------------------
// Batched Updates DB: batchedUpdatesDB
// -----------------------------------------------------------------------------
let updatesDBInstance = null;
export async function initUpdatesDB() {
  if (updatesDBInstance) return updatesDBInstance;
  try {
    updatesDBInstance = await openDB(UPDATES_DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(BATCHED_POKEMON_UPDATES_STORE)) {
          db.createObjectStore(BATCHED_POKEMON_UPDATES_STORE, { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains(BATCHED_TRADE_UPDATES_STORE)) {
          db.createObjectStore(BATCHED_TRADE_UPDATES_STORE, { keyPath: 'key' });
        }
      },
    });
  } catch (err) {
    console.error("UpdatesDB initialization failed:", err);
    updatesDBInstance = null;
  }
  return updatesDBInstance;
}

// -----------------------------------------------------------------------------
// Helper functions for Main DB (pokemonDB)
// -----------------------------------------------------------------------------
export async function getFromDB(storeName, key) {
  const db = await initDB();
  if (!db) return null;
  return db.get(storeName, key);
}

export async function putIntoDB(storeName, data) {
  const db = await initDB();
  if (!db) return;
  return db.put(storeName, data);
}

/**
 * Put bulk data into DB.
 * - On iOS: Break into smaller chunks (to avoid Safari issues with large transactions).
 * - If IndexedDB init fails, we do nothing (or could log an error).
 */
export async function putBulkIntoDB(storeName, dataArray) {
  const db = await initDB();
  if (!db) {
    console.warn("IndexedDB not available; cannot write data.");
    return;
  }

  // Log existing size for debug
  try {
    const totalDataSize = new Blob([JSON.stringify(dataArray)]).size;
    console.log(
      `putBulkIntoDB: Attempting to store ${dataArray.length} items in ${storeName}, total size: ${totalDataSize} bytes`
    );
  } catch (err) {
    console.log('Error measuring size in putBulkIntoDB:', err);
  }

  // For iOS, do smaller chunk writes
  if (isIOS) {
    const chunkSize = 100; // Adjust as needed
    console.log(`[iOS] Using chunked transactions of size ${chunkSize}`);
    for (let i = 0; i < dataArray.length; i += chunkSize) {
      const chunk = dataArray.slice(i, i + chunkSize);
      await putChunk(db, storeName, chunk);
    }
  } else {
    // Original logic for non-iOS
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    for (const data of dataArray) {
      store.put(data);
    }
    await tx.done;
  }
  console.log(`putBulkIntoDB completed for store ${storeName}`);
}

// Helper function to write a single chunk
async function putChunk(db, storeName, chunk) {
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  for (const data of chunk) {
    await store.put(data);
  }
  await tx.done;
}

/**
 * Retrieve all data from a store.
 * - On iOS, use chunked reading (to avoid issues with large store.getAll()).
 */
export async function getAllFromDB(storeName) {
  const db = await initDB();
  if (!db) {
    console.warn("IndexedDB not available; cannot read data.");
    return [];
  }

  if (isIOS) {
    return await getDataInChunks(db, storeName);
  } else {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const allData = await store.getAll();
    await tx.done;
    try {
      const allDataSize = new Blob([JSON.stringify(allData)]).size;
      console.log(
        `getAllFromDB: Retrieved ${allData.length} items from '${storeName}' (approx size: ${allDataSize} bytes)`
      );
    } catch (err) {
      console.log(`Error measuring size in getAllFromDB for store '${storeName}':`, err);
    }
    return allData;
  }
}

// Helper function to read data in chunks (iOS-only fallback for large reads)
async function getDataInChunks(db, storeName, batchSize = 100) {
  const tx = db.transaction(storeName, 'readonly');
  const store = tx.objectStore(storeName);
  const allKeys = await store.getAllKeys();
  const results = [];
  for (let i = 0; i < allKeys.length; i += batchSize) {
    const batchKeys = allKeys.slice(i, i + batchSize);
    for (const key of batchKeys) {
      results.push(await store.get(key));
    }
  }
  return results;
}

export async function clearStore(storeName) {
  const db = await initDB();
  if (!db) return;
  return db.clear(storeName);
}

export async function deleteFromDB(storeName, key) {
  const db = await initDB();
  if (!db) return;
  return db.delete(storeName, key);
}

// -----------------------------------------------------------------------------
// Helper functions for the Lists DB (pokemonListsDB)
// -----------------------------------------------------------------------------
export async function getFromListsDB(storeName, key) {
  const db = await initListsDB();
  if (!db) return null;
  return db.get(storeName, key);
}

export async function putIntoListsDB(storeName, data) {
  const db = await initListsDB();
  if (!db) return;
  return db.put(storeName, data);
}

export async function getAllFromListsDB(storeName) {
  const db = await initListsDB();
  if (!db) {
    console.warn("ListsDB not available; cannot read data.");
    return [];
  }
  const tx = db.transaction(storeName, 'readonly');
  const store = tx.objectStore(storeName);
  const allData = await store.getAll();
  await tx.done;
  try {
    const allDataSize = new Blob([JSON.stringify(allData)]).size;
    console.log(
      `getAllFromListsDB: Retrieved ${allData.length} items from '${storeName}' (approx size: ${allDataSize} bytes)`
    );
  } catch (err) {
    console.log(`Error measuring size in getAllFromListsDB for store '${storeName}':`, err);
  }
  return allData;
}

export async function clearListsStore(storeName) {
  const db = await initListsDB();
  if (!db) return;
  return db.clear(storeName);
}

// -----------------------------------------------------------------------------
// Batched Updates DB Functions
// -----------------------------------------------------------------------------
export async function getBatchedPokemonUpdates() {
  const db = await initUpdatesDB();
  if (!db) return [];
  return db.getAll(BATCHED_POKEMON_UPDATES_STORE);
}

export async function putBatchedPokemonUpdates(key, updateData) {
  const db = await initUpdatesDB();
  if (!db) return;
  return db.put(BATCHED_POKEMON_UPDATES_STORE, { key, ...updateData });
}

export async function clearBatchedPokemonUpdates() {
  const db = await initUpdatesDB();
  if (!db) return;
  return db.clear(BATCHED_POKEMON_UPDATES_STORE);
}

export async function getBatchedTradeUpdates() {
  const db = await initUpdatesDB();
  if (!db) return [];
  return db.getAll(BATCHED_TRADE_UPDATES_STORE);
}

export async function putBatchedTradeUpdates(key, updateData) {
  const db = await initUpdatesDB();
  if (!db) return;
  return db.put(BATCHED_TRADE_UPDATES_STORE, { key, ...updateData });
}

export async function clearBatchedTradeUpdates() {
  const db = await initUpdatesDB();
  if (!db) return;
  return db.clear(BATCHED_TRADE_UPDATES_STORE);
}

// -----------------------------------------------------------------------------
// Helper function to get all lists from IndexedDB and convert to object
// -----------------------------------------------------------------------------
export async function getAllListsFromDB() {
  const db = await initListsDB();
  if (!db) {
    console.warn("ListsDB not available; cannot read lists data.");
    return {};
  }
  const tx = db.transaction(LIST_STORES, 'readonly');
  const lists = {};
  await Promise.all(
    LIST_STORES.map(async storeName => {
      const store = tx.objectStore(storeName);
      const itemsArray = await store.getAll();
      const itemsObject = {};
      for (const item of itemsArray) {
        itemsObject[item.instance_id] = item;
      }
      lists[storeName] = itemsObject;
    })
  );
  await tx.done;
  try {
    const listsSize = new Blob([JSON.stringify(lists)]).size;
    console.log(`getAllListsFromDB: Combined lists size: ${listsSize} bytes`);
  } catch (err) {
    console.log('Error measuring combined lists size in getAllListsFromDB:', err);
  }
  return lists;
}

// -----------------------------------------------------------------------------
// Helper function to store lists into IndexedDB
// -----------------------------------------------------------------------------
export async function storeListsInIndexedDB(lists) {
  const db = await initListsDB();
  if (!db) {
    console.warn("ListsDB not available; cannot store lists data.");
    return;
  }
  const tx = db.transaction(LIST_STORES, 'readwrite');
  try {
    const listsSize = new Blob([JSON.stringify(lists)]).size;
    const keysCount = Object.keys(lists).length;
    console.log(
      `storeListsInIndexedDB: Storing lists with ${keysCount} keys, total size: ${listsSize} bytes`
    );
  } catch (err) {
    console.log('Error measuring size in storeListsInIndexedDB:', err);
  }
  await Promise.all(
    LIST_STORES.map(async listName => {
      const store = tx.objectStore(listName);
      await store.clear();
      const list = lists[listName];
      const itemsArray = Object.keys(list).map(instance_id => {
        return { ...list[instance_id], instance_id };
      });
      for (const item of itemsArray) {
        await store.put(item);
      }
    })
  );
  await tx.done;
}

// -----------------------------------------------------------------------------
// Trades DB Functions (create, update, etc.)
// -----------------------------------------------------------------------------
export async function getTradeByPokemonPair(proposedId, acceptingId) {
  const db = await initTradesDB();
  if (!db) return null;
  const tx = db.transaction(POKEMON_TRADES_STORE, 'readonly');
  const store = tx.objectStore(POKEMON_TRADES_STORE);
  const allTrades = await store.getAll();
  await tx.done;
  return allTrades.find(trade =>
    (trade.pokemon_instance_id_user_proposed === proposedId &&
     trade.pokemon_instance_id_user_accepting === acceptingId) ||
    (trade.pokemon_instance_id_user_proposed === acceptingId &&
     trade.pokemon_instance_id_user_accepting === proposedId)
  ) || null;
}

export async function getAllFromTradesDB(storeName) {
  const db = await initTradesDB();
  if (!db) {
    console.warn(`TradesDB not available; cannot read from '${storeName}'.`);
    return [];
  }
  const tx = db.transaction(storeName, 'readonly');
  const store = tx.objectStore(storeName);
  const allData = await store.getAll();
  await tx.done;
  try {
    const allDataSize = new Blob([JSON.stringify(allData)]).size;
    console.log(
      `getAllFromTradesDB: Retrieved ${allData.length} items from '${storeName}' (approx size: ${allDataSize} bytes)`
    );
  } catch (err) {
    console.log(`Error measuring size in getAllFromTradesDB for store '${storeName}':`, err);
  }
  return allData;
}

export async function setTradesinDB(storeName, dataArray) {
  const db = await initTradesDB();
  if (!db) {
    console.warn(`TradesDB not available; cannot set data in '${storeName}'.`);
    return;
  }
  try {
    const totalDataSize = new Blob([JSON.stringify(dataArray)]).size;
    console.log(
      `setTradesinDB: Storing ${dataArray.length} items in '${storeName}', size: ${totalDataSize} bytes`
    );
  } catch (err) {
    console.log('Error measuring size in setTradesinDB:', err);
  }
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  for (const data of dataArray) {
    store.put(data);
  }
  await tx.done;
}

export async function deleteFromTradesDB(storeName, key) {
  const db = await initTradesDB();
  if (!db) return;
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  await store.delete(key);
  await tx.done;
}

export async function clearTradesStore(storeName) {
  const db = await initTradesDB();
  if (!db) return;
  return db.clear(storeName);
}
