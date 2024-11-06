// indexedDBConfig.js

import { openDB } from 'idb';

// Define database constants
const DB_NAME = 'pokemonDB';
const DB_VERSION = 1;  // Set version to 1 across all usage

// Store names
const VARIANTS_STORE = 'pokemonVariants';
const OWNERSHIP_DATA_STORE = 'pokemonOwnership';
const LISTS_STORE = 'pokemonLists';
const METADATA_STORE = 'metadata';
const BATCHED_UPDATES_STORE = 'batchedUpdates';

// Initialize and upgrade the IndexedDB database
export async function initDB() {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion, newVersion, transaction) {
            if (oldVersion < 1) {
                if (!db.objectStoreNames.contains(VARIANTS_STORE)) {
                    db.createObjectStore(VARIANTS_STORE, { keyPath: 'pokemonKey' });
                }
                if (!db.objectStoreNames.contains(OWNERSHIP_DATA_STORE)) {
                    db.createObjectStore(OWNERSHIP_DATA_STORE, { keyPath: 'instance_id' });
                }
                if (!db.objectStoreNames.contains(LISTS_STORE)) {
                    db.createObjectStore(LISTS_STORE, { keyPath: 'key' });
                }
                if (!db.objectStoreNames.contains(METADATA_STORE)) {
                    db.createObjectStore(METADATA_STORE, { keyPath: 'key' });
                }
                if (!db.objectStoreNames.contains(BATCHED_UPDATES_STORE)) {
                    db.createObjectStore(BATCHED_UPDATES_STORE, { keyPath: 'key' });
                }
            }
        },
    });
}

// Helper function to get data from a store
export async function getFromDB(storeName, key) {
    const db = await initDB();
    return db.get(storeName, key);
}

// Helper function to add or update data in a store
export async function putIntoDB(storeName, key, data) {
    const db = await initDB();
    if (storeName === VARIANTS_STORE) {
        if (!data.pokemonKey) {
            throw new Error("Data must include 'pokemonKey' for pokemonVariants store.");
        }
        return db.put(storeName, data);
    } else {
        return db.put(storeName, { key, data, timestamp: Date.now() });
    }
}

// Helper function to get all entries from a store
export async function getAllFromDB(storeName) {
    const db = await initDB();
    return db.getAll(storeName);
}

// Helper function to clear all entries from a store
export async function clearStore(storeName) {
    const db = await initDB();
    return db.clear(storeName);
}

// Helper function to delete an entry from a store
export async function deleteFromDB(storeName, key) {
    const db = await initDB();
    return db.delete(storeName, key);
}

// Helper function to store metadata
export async function updateMetadata(key, timestamp) {
    const db = await initDB();
    return db.put(METADATA_STORE, { key, timestamp });
}

// Helper function to get metadata
export async function getMetadata(key) {
    const db = await initDB();
    return db.get(METADATA_STORE, key);
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
