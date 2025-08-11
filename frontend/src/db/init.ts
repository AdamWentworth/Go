// db/init.ts
import { openDB, IDBPDatabase } from 'idb';
import {
  DB_VERSION,
  VARIANTS_DB_NAME, INSTANCES_DB_NAME, TAGS_DB_NAME,
  TRADES_DB_NAME,   UPDATES_DB_NAME,   POKEDEX_DB_NAME,
  REGISTRATIONS_DB_NAME,
  VARIANTS_STORE, INSTANCES_STORE,
  POKEMON_TRADES_STORE, RELATED_INSTANCES_STORE,
  REGISTRATIONS_STORE,
  BATCHED_POKEMON_UPDATES_STORE, BATCHED_TRADE_UPDATES_STORE,
  POKEDEX_STORES,
  TAG_DEFS_STORE, INSTANCE_TAGS_STORE,
  SYSTEM_CHILDREN_STORE,
} from './constants';

interface Doc { [k: string]: unknown; }

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

export const initVariantsDB = makeInit(VARIANTS_DB_NAME, (db) => {
  if (!db.objectStoreNames.contains(VARIANTS_STORE)) {
    db.createObjectStore(VARIANTS_STORE, { keyPath: 'variant_id' });
  }
});

export const initInstancesDB = makeInit(INSTANCES_DB_NAME, (db) => {
  if (!db.objectStoreNames.contains(INSTANCES_STORE)) {
    db.createObjectStore(INSTANCES_STORE, { keyPath: 'instance_id' });
  }
});

/** Tags DB: normalized + lean snapshot (no legacy per-bucket stores) */
export const initTagsDB = makeInit(TAGS_DB_NAME, (db) => {
  if (!db.objectStoreNames.contains(TAG_DEFS_STORE)) {
    const s = db.createObjectStore(TAG_DEFS_STORE, { keyPath: 'tag_id' });
    s.createIndex('by_user_parent', ['user_id', 'parent']);
  }

  if (!db.objectStoreNames.contains(INSTANCE_TAGS_STORE)) {
    const s = db.createObjectStore(INSTANCE_TAGS_STORE, { keyPath: 'key' }); // `${tag_id}:${instance_id}`
    s.createIndex('by_tag', 'tag_id');
    s.createIndex('by_instance', 'instance_id');
    s.createIndex('by_user', 'user_id');
  }

  if (!db.objectStoreNames.contains(SYSTEM_CHILDREN_STORE)) {
    db.createObjectStore(SYSTEM_CHILDREN_STORE, { keyPath: 'key' });
  }
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
      db.createObjectStore(s, { keyPath: 'variant_id' });
    }
  });
});

export const initRegistrationsDB = makeInit(REGISTRATIONS_DB_NAME, (db) => {
  if (!db.objectStoreNames.contains(REGISTRATIONS_STORE)) {
    db.createObjectStore(REGISTRATIONS_STORE, { keyPath: 'variant_id' });
  }
});
