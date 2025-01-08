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
export async function createTrade(tradeData) {
    const db = await initTradesDB();
    const tx = db.transaction(POKEMON_TRADES_STORE, 'readwrite');
    const store = tx.objectStore(POKEMON_TRADES_STORE);
    // Ensure tradeData includes required fields
    const trade = {
        ...tradeData,
        trade_status: TRADE_STATUSES.PROPOSED,
        trade_proposal_date: new Date().toISOString(),
        is_special_trade: tradeData.is_special_trade || 0,
        is_registered_trade: tradeData.is_registered_trade || 0,
        is_lucky_trade: tradeData.is_lucky_trade || 0,
        trade_friendship_level: tradeData.trade_friendship_level || TRADE_FRIENDSHIP_LEVELS[1], // Assuming 1 corresponds to 'Good'
    };
    const tradeId = await store.add(trade);
    await tx.done;
    return tradeId;
}

// Update trade status and relevant dates
export async function updateTradeStatus(tradeId, newStatus) {
    if (!Object.values(TRADE_STATUSES).includes(newStatus)) {
        throw new Error('Invalid trade status');
    }
    const db = await initTradesDB();
    const tx = db.transaction(POKEMON_TRADES_STORE, 'readwrite');
    const store = tx.objectStore(POKEMON_TRADES_STORE);
    const trade = await store.get(tradeId);
    if (!trade) {
        throw new Error('Trade not found');
    }
    trade.trade_status = newStatus;
    const currentDate = new Date().toISOString();

    // Update relevant date fields based on status
    switch (newStatus) {
        case TRADE_STATUSES.ACCEPTED:
            trade.trade_accepted_date = currentDate;
            break;
        case TRADE_STATUSES.COMPLETED:
            trade.trade_completed_date = currentDate;
            break;
        case TRADE_STATUSES.CANCELLED:
            trade.trade_cancelled_date = currentDate;
            break;
        // Add other cases if necessary
        default:
            break;
    }

    trade.updatedAt = currentDate;
    await store.put(trade);
    await tx.done;
}

// In your IndexedDB utility file (e.g., tradesDB.js)

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
  
// Get trades by status
export async function getTradesByStatus(status) {
    if (!Object.values(TRADE_STATUSES).includes(status)) {
        throw new Error('Invalid trade status');
    }
    const db = await initTradesDB();
    const store = db.transaction(POKEMON_TRADES_STORE).objectStore(POKEMON_TRADES_STORE);
    const index = store.index('trade_status_idx');
    return index.getAll(status);
}

// Get trades by username (proposed or accepting)
export async function getTradesByUsername(username) {
    const db = await initTradesDB();
    const store = db.transaction(POKEMON_TRADES_STORE).objectStore(POKEMON_TRADES_STORE);

    // Using indexes to query trades where username_proposed or username_accepting matches
    const proposedTradesPromise = store.index('username_proposed_idx').getAll(IDBKeyRange.only(username));
    const acceptingTradesPromise = store.index('username_accepting_idx').getAll(IDBKeyRange.only(username));

    const [proposedTrades, acceptingTrades] = await Promise.all([proposedTradesPromise, acceptingTradesPromise]);

    // Combine and remove duplicates if any
    const combined = [...proposedTrades, ...acceptingTrades];
    const uniqueTrades = combined.filter((trade, index, self) =>
        index === self.findIndex(t => t.trade_id === trade.trade_id)
    );

    return uniqueTrades;
}

// Get trades by Pokémon instance ID (proposed or accepting)
export async function getTradesByPokemonInstanceId(pokemonInstanceId) {
    const db = await initTradesDB();
    const store = db.transaction(POKEMON_TRADES_STORE).objectStore(POKEMON_TRADES_STORE);

    // Create two promises to get trades where Pokémon is proposed or accepting
    const proposedIndex = store.index('pokemon_instance_id_user_proposed_idx');
    const acceptingIndex = store.index('pokemon_instance_id_user_accepting_idx');

    const proposedTradesPromise = proposedIndex.getAll(IDBKeyRange.only(pokemonInstanceId));
    const acceptingTradesPromise = acceptingIndex.getAll(IDBKeyRange.only(pokemonInstanceId));

    const [proposedTrades, acceptingTrades] = await Promise.all([proposedTradesPromise, acceptingTradesPromise]);

    // Combine and remove duplicates if any
    const combined = [...proposedTrades, ...acceptingTrades];
    const uniqueTrades = combined.filter((trade, index, self) =>
        index === self.findIndex(t => t.trade_id === trade.trade_id)
    );

    return uniqueTrades;
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
    const db = await initTradesDB();
    return db.delete(storeName, key);
}

// Clear all trades
export async function clearTradesStore(storeName) {
    const db = await initTradesDB();
    return db.clear(storeName);
  }
  

// Related Instances Functions (if needed)
// Example: Add related instance
export async function addRelatedInstance(instanceData, tradeId) {
    const db = await initTradesDB();
    const tx = db.transaction(RELATED_INSTANCES_STORE, 'readwrite');
    const store = tx.objectStore(RELATED_INSTANCES_STORE);
  
    // Ensure instanceData includes 'instance_id'
    if (!instanceData.instance_id) {
      throw new Error('Missing "instance_id" in instanceData.');
    }
  
    // Optionally associate with trade_id
    const relatedEntry = {
      ...instanceData,
      trade_id: tradeId, // Link to the trade
    };
  
    // Attempt to add the related entry
    try {
      await store.add(relatedEntry);
    } catch (error) {
      if (error.name === 'ConstraintError' || error.name === 'AbortError') {
        console.warn(
          `Related instance with ID ${relatedEntry.instance_id} already exists. Skipping duplicate entry during add.`
        );
        // Skip adding; proceed to transaction completion handling.
      } else {
        console.error('Failed to add related instance:', error);
        throw new Error('Adding related instance failed at add step.');
      }
    }
  
    // Attempt to complete the transaction
    try {
      await tx.done;
    } catch (error) {
      if (error.name === 'AbortError' || error.name === 'ConstraintError') {
        console.warn(
          `Transaction for related instance ID ${relatedEntry.instance_id} completed with an error, but proceeding.`
        );
        // Even if tx.done failed due to duplicate, we can proceed.
      } else {
        console.error('Transaction failed:', error);
        throw new Error('Adding related instance failed at transaction commit.');
      }
    }
  
    return relatedEntry.instance_id;
  }
  

// Example: Get related instances by trade_id
export async function getRelatedInstancesByTradeId(tradeId) {
    const db = await initTradesDB();
    const store = db.transaction(RELATED_INSTANCES_STORE).objectStore(RELATED_INSTANCES_STORE);
    const index = store.index('trade_id_idx'); // Ensure you have an index on trade_id
    return index.getAll(tradeId);
}