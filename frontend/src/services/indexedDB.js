// indexedDB.js

import { openDB } from 'idb';

// Define database constants
const DB_NAME = 'pokemonDB';
const LISTS_DB_NAME = 'pokemonListsDB'; // New database for lists
const DB_VERSION = 1;  // Keeping version at 1 as per your request

// Store names
const VARIANTS_STORE = 'pokemonVariants';
const OWNERSHIP_DATA_STORE = 'pokemonOwnership';
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
    const db = await initListsDB();

    for (const listName of LIST_STORES) {
        const tx = db.transaction(listName, 'readwrite');
        const store = tx.objectStore(listName);

        // Clear the store before adding new data
        store.clear();

        const list = lists[listName];
        const itemsArray = Object.keys(list).map(instance_id => {
            return { ...list[instance_id], instance_id };
        });

        for (const item of itemsArray) {
            store.put(item);
        }

        await tx.done;
    }
}