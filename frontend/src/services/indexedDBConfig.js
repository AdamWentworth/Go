// indexedDBConfig.js

import { openDB } from 'idb';

// Define database constants
const DB_NAME = 'pokemonDB';
const LISTS_DB_NAME = 'pokemonListsDB'; // New database for lists
const DB_VERSION = 1;  // Keeping version at 1 as per your request

// Store names
const VARIANTS_STORE = 'pokemonVariants';
const OWNERSHIP_DATA_STORE = 'pokemonOwnership';
const METADATA_STORE = 'metadata';
const BATCHED_UPDATES_STORE = 'batchedUpdates';

// New stores for lists
const LIST_STORES = ['owned', 'unowned', 'wanted', 'trade'];

// Initialize and upgrade the main IndexedDB database
export async function initDB() {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(VARIANTS_STORE)) {
                db.createObjectStore(VARIANTS_STORE, { keyPath: 'pokemonKey' });
            }
            if (!db.objectStoreNames.contains(OWNERSHIP_DATA_STORE)) {
                db.createObjectStore(OWNERSHIP_DATA_STORE, { keyPath: 'instance_id' });
            }
            if (!db.objectStoreNames.contains(METADATA_STORE)) {
                db.createObjectStore(METADATA_STORE, { keyPath: 'key' });
            }
            if (!db.objectStoreNames.contains(BATCHED_UPDATES_STORE)) {
                db.createObjectStore(BATCHED_UPDATES_STORE, { keyPath: 'key' });
            }
        },
    });
}

// Initialize and upgrade the lists IndexedDB database
export async function initListsDB() {
    return openDB(LISTS_DB_NAME, DB_VERSION, {
        upgrade(db) {
            // Create new stores for lists
            LIST_STORES.forEach(storeName => {
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName, { keyPath: 'instance_id' });
                }
            });
        },
    });
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

export async function getAllFromDB(storeName) {
    const db = await initDB();
    return db.getAll(storeName);
}

export async function clearStore(storeName) {
    const db = await initDB();
    return db.clear(storeName);
}

export async function deleteFromDB(storeName, key) {
    const db = await initDB();
    return db.delete(storeName, key);
}

export async function updateMetadata(key, timestamp) {
    const db = await initDB();
    return db.put(METADATA_STORE, { key, timestamp });
}

export async function getMetadata(key) {
    const db = await initDB();
    return db.get(METADATA_STORE, key);
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
    return db.getAll(storeName);
}

export async function clearListsStore(storeName) {
    const db = await initListsDB();
    return db.clear(storeName);
}

// Batched Updates Functions for periodic updates

// Retrieve all batched updates from IndexedDB
export async function getBatchedUpdates() {
    const db = await initDB();
    return await db.getAll(BATCHED_UPDATES_STORE);
}

// Add or update a single batched update in IndexedDB
export async function putBatchedUpdates(key, updateData) {
    const db = await initDB();
    await db.put(BATCHED_UPDATES_STORE, { key, ...updateData });
}

// Clear all batched updates from IndexedDB
export async function clearBatchedUpdates() {
    const db = await initDB();
    return db.clear(BATCHED_UPDATES_STORE);
}

// Helper function to get list from IndexedDB and convert to object
export async function getListFromDB(storeName) {
    const itemsArray = await getAllFromListsDB(storeName);
    const itemsObject = {};
    for (const item of itemsArray) {
        itemsObject[item.instance_id] = item;
    }
    return itemsObject;
}

// Helper function to store lists into IndexedDB
export async function storeListsInIndexedDB(lists) {
    for (const listName of LIST_STORES) {
        // Clear the store before adding new data
        await clearListsStore(listName);

        const list = lists[listName];
        for (const instance_id in list) {
            const item = list[instance_id];
            // Ensure item includes 'instance_id'
            const data = { ...item, instance_id };
            await putIntoListsDB(listName, data);
        }
    }
}
