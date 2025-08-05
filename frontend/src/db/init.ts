// db/init.ts
import { openDB, IDBPDatabase } from 'idb';
import {
  DB_VERSION,
  /* DB names */
  VARIANTS_DB_NAME, INSTANCES_DB_NAME, TAGS_DB_NAME,
  TRADES_DB_NAME,   UPDATES_DB_NAME,   POKEDEX_DB_NAME,
  REGISTRATIONS_DB_NAME,
  /* store names */
  VARIANTS_STORE, INSTANCES_STORE, TAG_STORE_NAMES,
  POKEMON_TRADES_STORE, RELATED_INSTANCES_STORE,
  REGISTRATIONS_STORE,
  BATCHED_POKEMON_UPDATES_STORE, BATCHED_TRADE_UPDATES_STORE,
  POKEDEX_STORES,
} from './constants';

interface Doc { [k: string]: unknown; }

/* generic helper ----------------------------------------------------------- */
function makeInit(
  dbName: string,
  upgrade: (db: IDBPDatabase<Doc>) => void
) {
  let ref: IDBPDatabase<Doc> | null = null;
  return async () => {
    if (ref) return ref;
    try {
      ref = await openDB<Doc>(dbName, DB_VERSION, { upgrade });
    } catch (err) {
      console.error(`${dbName} init failed:`, err);
      ref = null;
    }
    return ref;
  };
}

/* individual DB initialisers ---------------------------------------------- */
export const initVariantsDB = makeInit(VARIANTS_DB_NAME, (db) => {
  if (!db.objectStoreNames.contains(VARIANTS_STORE)) {
    db.createObjectStore(VARIANTS_STORE, { keyPath: 'pokemonKey' });
  }
});

export const initInstancesDB = makeInit(INSTANCES_DB_NAME, (db) => {
  if (!db.objectStoreNames.contains(INSTANCES_STORE)) {
    db.createObjectStore(INSTANCES_STORE, { keyPath: 'instance_id' });
  }
});

export const initTagsDB = makeInit(TAGS_DB_NAME, (db) => {
  TAG_STORE_NAMES.forEach((s) => {
    if (!db.objectStoreNames.contains(s)) {
      db.createObjectStore(s, { keyPath: 'instance_id' });
    }
  });
});

export const initTradesDB = makeInit(TRADES_DB_NAME, (db) => {
  if (!db.objectStoreNames.contains(POKEMON_TRADES_STORE)) {
    db.createObjectStore(POKEMON_TRADES_STORE, { keyPath: 'trade_id' });
  }
  if (!db.objectStoreNames.contains(RELATED_INSTANCES_STORE)) {
    db.createObjectStore(RELATED_INSTANCES_STORE, { keyPath: 'instance_id' });
  }
});

export const initUpdatesDB = makeInit(UPDATES_DB_NAME, (db) => {
  if (!db.objectStoreNames.contains(BATCHED_POKEMON_UPDATES_STORE)) {
    db.createObjectStore(BATCHED_POKEMON_UPDATES_STORE, { keyPath: 'key' });
  }
  if (!db.objectStoreNames.contains(BATCHED_TRADE_UPDATES_STORE)) {
    db.createObjectStore(BATCHED_TRADE_UPDATES_STORE, { keyPath: 'key' });
  }
});

export const initPokedexDB = makeInit(POKEDEX_DB_NAME, (db) => {
  POKEDEX_STORES.forEach((s) => {
    if (!db.objectStoreNames.contains(s)) {
      db.createObjectStore(s, { keyPath: 'pokemonKey' });
    }
  });
});

export const initRegistrationsDB = makeInit(REGISTRATIONS_DB_NAME, (db) => {
  if (!db.objectStoreNames.contains(REGISTRATIONS_STORE)) {
    db.createObjectStore(REGISTRATIONS_STORE, { keyPath: 'variant_id' });
  }
});
