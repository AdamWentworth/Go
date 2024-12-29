// indexedDB.js

import { openDB } from 'idb';

// Define database constants
const DB_NAME = 'pokemonDB';
const LISTS_DB_NAME = 'pokemonListsDB'; // New database for lists
const DB_VERSION = 1;

// Store names
const VARIANTS_STORE = 'pokemonVariants';
export const OWNERSHIP_DATA_STORE = 'pokemonOwnership';
const BATCHED_UPDATES_STORE = 'batchedUpdates';
const TRADES_STORE = 'pokemonTrades';

// New stores for lists
const LIST_STORES = ['owned', 'unowned', 'wanted', 'trade'];

// Enumerate trade statuses and friendship levels
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

// Cache database instances
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
            if (!db.objectStoreNames.contains(BATCHED_UPDATES_STORE)) {
                db.createObjectStore(BATCHED_UPDATES_STORE, { keyPath: 'key' });
            }
            if (!db.objectStoreNames.contains(TRADES_STORE)) {
                db.createObjectStore(TRADES_STORE, {keyPath: 'trade_id'});
            }
        },
    });
    return dbInstance;
}

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

// Helper functions for the main database
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

// Helper functions for the lists database
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

// Batched Updates Functions for periodic updates
export async function getBatchedUpdates() {
    const db = await initDB();
    return await db.getAll(BATCHED_UPDATES_STORE);
}

export async function putBatchedUpdates(key, updateData) {
    const db = await initDB();
    await db.put(BATCHED_UPDATES_STORE, { key, ...updateData });
}

export async function clearBatchedUpdates() {
    const db = await initDB();
    return db.clear(BATCHED_UPDATES_STORE);
}

// Helper function to get all lists from IndexedDB and convert to object
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

// Helper function to store lists into IndexedDB
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

// Create a new trade proposal
export async function createTrade(tradeData) {
    const db = await initDB();
    const tx = db.transaction(TRADES_STORE, 'readwrite');
    const store = tx.objectStore(TRADES_STORE);
    // Ensure tradeData includes required fields
    const trade = {
        ...tradeData,
        trade_status: TRADE_STATUSES.PROPOSED,
        trade_proposal_date: new Date().toISOString(),
        is_special_trade: tradeData.is_special_trade || 0,
        is_registered_trade: tradeData.is_registered_trade || 0,
        is_lucky_trade: tradeData.is_lucky_trade || 0,
        trade_friendship_level: tradeData.trade_friendship_level || TRADE_FRIENDSHIP_LEVELS.GOOD,
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
    const db = await initDB();
    const tx = db.transaction(TRADES_STORE, 'readwrite');
    const store = tx.objectStore(TRADES_STORE);
    const trade = await store.get(tradeId);
    if (!trade) {
        throw new Error('Trade not found');
    }
    trade.trade_status = newStatus;
    const currentDate = new Date();

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

// Get trades by status
export async function getTradesByStatus(status) {
    if (!Object.values(TRADE_STATUSES).includes(status)) {
        throw new Error('Invalid trade status');
    }
    const db = await initDB();
    const store = db.transaction(TRADES_STORE).objectStore(TRADES_STORE);
    const index = store.index('trade_status_idx');
    return index.getAll(status);
}

// Get trades by username (proposed or accepting)
export async function getTradesByUsername(username) {
    const db = await initDB();
    const store = db.transaction(TRADES_STORE).objectStore(TRADES_STORE);

    // Using indexes to query trades where username_proposed or username_accepting matches
    const proposedTrades = store.index('username_proposed_idx').getAll(IDBKeyRange.only(username));
    const acceptingTrades = store.index('username_accepting_idx').getAll(IDBKeyRange.only(username));

    const [proposed, accepting] = await Promise.all([proposedTrades, acceptingTrades]);

    // Combine and remove duplicates if any
    const combined = [...proposed, ...accepting];
    const uniqueTrades = combined.filter((trade, index, self) =>
        index === self.findIndex(t => t.trade_id === trade.trade_id)
    );

    return uniqueTrades;
}

// Get trades by Pokémon instance ID (proposed or accepting)
export async function getTradesByPokemonInstanceId(pokemonInstanceId) {
    const db = await initDB();
    const store = db.transaction(TRADES_STORE).objectStore(TRADES_STORE);

    // Create two promises to get trades where Pokémon is proposed or accepting
    const proposedIndex = store.index('pokemon_instance_id_user_proposed_idx');
    const acceptingIndex = store.index('pokemon_instance_id_user_accepting_idx');

    const proposedTrades = proposedIndex.getAll(pokemonInstanceId);
    const acceptingTrades = acceptingIndex.getAll(pokemonInstanceId);

    const [proposed, accepting] = await Promise.all([proposedTrades, acceptingTrades]);

    // Combine and remove duplicates if any
    const combined = [...proposed, ...accepting];
    const uniqueTrades = combined.filter((trade, index, self) =>
        index === self.findIndex(t => t.trade_id === trade.trade_id)
    );

    return uniqueTrades;
}

// Get all trades
export async function getAllTrades() {
    return getAllFromDB(TRADES_STORE);
}

// Delete a trade
export async function deleteTrade(tradeId) {
    return deleteFromDB(TRADES_STORE, tradeId);
}