// db/init.ts

import { openDB, IDBPDatabase } from 'idb';
import {
  DB_NAME,
  DB_VERSION,
  VARIANTS_STORE,
  OWNERSHIP_DATA_STORE,
  LISTS_DB_NAME,
  LIST_STORES,
  TRADES_DB_NAME,
  POKEMON_TRADES_STORE,
  RELATED_INSTANCES_STORE,
  UPDATES_DB_NAME,
  BATCHED_POKEMON_UPDATES_STORE,
  BATCHED_TRADE_UPDATES_STORE,
  POKEDEX_LISTS_DB_NAME,
  POKEDEX_LISTS_STORES,
} from './constants';

// Define generic database interface
interface IndexedDBObject {
  [key: string]: unknown;
}

let dbInstance: IDBPDatabase<IndexedDBObject> | null = null;
export async function initDB(): Promise<IDBPDatabase<IndexedDBObject> | null> {
  if (dbInstance) return dbInstance;
  try {
    dbInstance = await openDB<IndexedDBObject>(DB_NAME, DB_VERSION, {
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

let listsDBInstance: IDBPDatabase<IndexedDBObject> | null = null;
export async function initListsDB(): Promise<IDBPDatabase<IndexedDBObject> | null> {
  if (listsDBInstance) return listsDBInstance;
  try {
    listsDBInstance = await openDB<IndexedDBObject>(LISTS_DB_NAME, DB_VERSION, {
      upgrade(db) {
        LIST_STORES.forEach((storeName: string) => {
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

let tradesDBInstance: IDBPDatabase<IndexedDBObject> | null = null;
export async function initTradesDB(): Promise<IDBPDatabase<IndexedDBObject> | null> {
  if (tradesDBInstance) return tradesDBInstance;
  try {
    tradesDBInstance = await openDB<IndexedDBObject>(TRADES_DB_NAME, DB_VERSION, {
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

let updatesDBInstance: IDBPDatabase<IndexedDBObject> | null = null;
export async function initUpdatesDB(): Promise<IDBPDatabase<IndexedDBObject> | null> {
  if (updatesDBInstance) return updatesDBInstance;
  try {
    updatesDBInstance = await openDB<IndexedDBObject>(UPDATES_DB_NAME, DB_VERSION, {
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

let pokedexListsDBInstance: IDBPDatabase<IndexedDBObject> | null = null;
export async function initPokedexListsDB(): Promise<IDBPDatabase<IndexedDBObject> | null> {
  if (pokedexListsDBInstance) return pokedexListsDBInstance;
  try {
    pokedexListsDBInstance = await openDB<IndexedDBObject>(POKEDEX_LISTS_DB_NAME, DB_VERSION, {
      upgrade(db) {
        POKEDEX_LISTS_STORES.forEach((storeName: string) => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'pokemonKey' });
          }
        });
      },
    });
  } catch (err) {
    console.error("PokedexListsDB initialization failed:", err);
    pokedexListsDBInstance = null;
  }
  return pokedexListsDBInstance;
}
