// indexedDB.js

import { openDB } from 'idb';

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
    if (dbInstance) return dbInstance;
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
    return dbInstance;
}

// -----------------------------------------------------------------------------
// Lists DB: pokemonListsDB
// -----------------------------------------------------------------------------
let listsDBInstance = null;
export async function initListsDB() {
    if (listsDBInstance) return listsDBInstance;
    listsDBInstance = await openDB(LISTS_DB_NAME, DB_VERSION, {
        upgrade(db) {
            // Create new stores for lists
            LIST_STORES.forEach(storeName => {
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName, { keyPath: 'instance_id' });
                }
            });
        },
    });
    return listsDBInstance;
}

// -----------------------------------------------------------------------------
// Trades DB: tradesDB
// -----------------------------------------------------------------------------
let tradesDBInstance = null;
export async function initTradesDB() {
    if (tradesDBInstance) return tradesDBInstance;
    tradesDBInstance = await openDB(TRADES_DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(POKEMON_TRADES_STORE)) {
                db.createObjectStore(POKEMON_TRADES_STORE, { keyPath: 'trade_id',});
            }
            if (!db.objectStoreNames.contains(RELATED_INSTANCES_STORE)) {
                db.createObjectStore(RELATED_INSTANCES_STORE, { keyPath: 'instance_id',});
            }
        },
    });
    return tradesDBInstance;
}

// -----------------------------------------------------------------------------
// Batched Updates DB: batchedUpdatesDB
// -----------------------------------------------------------------------------
let updatesDBInstance = null;
export async function initUpdatesDB() {
    if (updatesDBInstance) return updatesDBInstance;
    updatesDBInstance = await openDB(UPDATES_DB_NAME, DB_VERSION, {
        upgrade(db) {
            // Create store for Pokemon-related batch updates
            if (!db.objectStoreNames.contains(BATCHED_POKEMON_UPDATES_STORE)) {
                db.createObjectStore(BATCHED_POKEMON_UPDATES_STORE, { keyPath: 'key' });
            }

            // Create store for Trade-related batch updates
            if (!db.objectStoreNames.contains(BATCHED_TRADE_UPDATES_STORE)) {
                db.createObjectStore(BATCHED_TRADE_UPDATES_STORE, { keyPath: 'key' });
            }
        },
    });
    return updatesDBInstance;
}

// -----------------------------------------------------------------------------
// Helper functions for Main DB (pokemonDB)
// -----------------------------------------------------------------------------
export async function getFromDB(storeName, key) {
    const db = await initDB();
    return db.get(storeName, key);
}

export async function putIntoDB(storeName, data) {
    const db = await initDB();
    return db.put(storeName, data);
}

export async function putBulkIntoDB(storeName, dataArray) {
    const db = await initDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    for (const data of dataArray) {
        store.put(data);
    }
    await tx.done;
}

export async function getAllFromDB(storeName) {
    const db = await initDB();
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const allData = await store.getAll();
    await tx.done;
    return allData;
}

export async function clearStore(storeName) {
    const db = await initDB();
    return db.clear(storeName);
}

export async function deleteFromDB(storeName, key) {
    const db = await initDB();
    return db.delete(storeName, key);
}

// -----------------------------------------------------------------------------
// Helper functions for the Lists DB (pokemonListsDB)
// -----------------------------------------------------------------------------
export async function getFromListsDB(storeName, key) {
    const db = await initListsDB();
    return db.get(storeName, key);
}

export async function putIntoListsDB(storeName, data) {
    const db = await initListsDB();
    return db.put(storeName, data);
}

export async function getAllFromListsDB(storeName) {
    const db = await initListsDB();
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const allData = await store.getAll();
    await tx.done;
    return allData;
}

export async function clearListsStore(storeName) {
    const db = await initListsDB();
    return db.clear(storeName);
}

// -----------------------------------------------------------------------------
// Batched Updates in the new Updates DB
// -----------------------------------------------------------------------------

// 1. Pokemon Updates
export async function getBatchedPokemonUpdates() {
    const db = await initUpdatesDB();
    return db.getAll(BATCHED_POKEMON_UPDATES_STORE);
}

export async function putBatchedPokemonUpdates(key, updateData) {
    const db = await initUpdatesDB();
    return db.put(BATCHED_POKEMON_UPDATES_STORE, { key, ...updateData });
}

export async function clearBatchedPokemonUpdates() {
    const db = await initUpdatesDB();
    return db.clear(BATCHED_POKEMON_UPDATES_STORE);
}

// 2. Trade Updates
export async function getBatchedTradeUpdates() {
    const db = await initUpdatesDB();
    return db.getAll(BATCHED_TRADE_UPDATES_STORE);
}

export async function putBatchedTradeUpdates(key, updateData) {
    const db = await initUpdatesDB();
    return db.put(BATCHED_TRADE_UPDATES_STORE, { key, ...updateData });
}

export async function clearBatchedTradeUpdates() {
    const db = await initUpdatesDB();
    return db.clear(BATCHED_TRADE_UPDATES_STORE);
}

// -----------------------------------------------------------------------------
// Helper function to get all lists from IndexedDB and convert to object
// -----------------------------------------------------------------------------
export async function getAllListsFromDB() {
    const db = await initListsDB();
    const tx = db.transaction(LIST_STORES, 'readonly');
    const lists = {};

    await Promise.all(
        LIST_STORES.map(async (storeName) => {
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
    return lists;
}

// -----------------------------------------------------------------------------
// Helper function to store lists into IndexedDB
// -----------------------------------------------------------------------------
export async function storeListsInIndexedDB(lists) {
    const db = await initListsDB();
    const tx = db.transaction(LIST_STORES, 'readwrite');

    await Promise.all(
        LIST_STORES.map(async (listName) => {
            const store = tx.objectStore(listName);
            // Clear the store before adding new data
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
    const tx = db.transaction(POKEMON_TRADES_STORE, 'readonly');
    const store = tx.objectStore(POKEMON_TRADES_STORE);
  
    // Retrieve all trades from the store
    const allTrades = await store.getAll();
    await tx.done;
  
    // Find a trade that matches the pairing in either direction
    const existingTrade = allTrades.find(trade => 
      (trade.pokemon_instance_id_user_proposed === proposedId &&
       trade.pokemon_instance_id_user_accepting === acceptingId) ||
      (trade.pokemon_instance_id_user_proposed === acceptingId &&
       trade.pokemon_instance_id_user_accepting === proposedId)
    );
  
    return existingTrade || null;
  }

// Get all trades
export async function getAllFromTradesDB(storeName) {
    const db = await initTradesDB();
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const allData = await store.getAll();
    await tx.done;
    return allData;
}

export async function setTradesinDB(storeName, dataArray) {
    try {
        const db = await initTradesDB();
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        for (const data of dataArray) {
            store.put(data);
        }
        await tx.done;
    } catch (error) {
        console.error('[setTradesinDB] ERROR:', error);
    }
}

// Delete a trade
export async function deleteFromTradesDB(storeName, key) {
    try {
      const db = await initTradesDB();
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      await store.delete(key);
      await tx.done;
    } catch (error) {
      console.error('[deleteFromTradesDB] ERROR:', error);
    }
  }  

// Clear all trades
export async function clearTradesStore(storeName) {
    const db = await initTradesDB();
    return db.clear(storeName);
  }
  
