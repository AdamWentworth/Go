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

// New stores for lists
const LIST_STORES = ['owned', 'unowned', 'wanted', 'trade'];

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