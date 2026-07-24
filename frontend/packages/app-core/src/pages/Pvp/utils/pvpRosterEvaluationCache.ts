import { createScopedLogger } from '@/utils/logger';
import type { PokemonPvPRosterEvaluationResponse } from '@shared-contracts/pokemon';
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

const DATABASE_NAME = 'pokegonexus-pvp-roster-cache';
const STORE_NAME = 'evaluations';
const DATABASE_VERSION = 1;
const MAX_ENTRIES = 24;
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

const log = createScopedLogger('pvpRosterEvaluationCache');

type CacheEntry = {
  key: string;
  createdAt: number;
  response: PokemonPvPRosterEvaluationResponse;
};

interface CacheSchema extends DBSchema {
  evaluations: {
    key: string;
    value: CacheEntry;
    indexes: { 'by-created-at': number };
  };
}

const memoryCache = new Map<string, CacheEntry>();
let databasePromise: Promise<IDBPDatabase<CacheSchema> | null> | null = null;

const getDatabase = async (): Promise<IDBPDatabase<CacheSchema> | null> => {
  if (typeof indexedDB === 'undefined') return null;
  if (!databasePromise) {
    databasePromise = openDB<CacheSchema>(
      DATABASE_NAME,
      DATABASE_VERSION,
      {
        upgrade(database) {
          if (!database.objectStoreNames.contains(STORE_NAME)) {
            const store = database.createObjectStore(STORE_NAME, {
              keyPath: 'key',
            });
            store.createIndex('by-created-at', 'createdAt');
          }
        },
      },
    ).catch((error) => {
      log.warn('Personal PvP cache unavailable', error);
      databasePromise = null;
      return null;
    });
  }
  return databasePromise;
};

const fresh = (entry: CacheEntry | undefined): entry is CacheEntry =>
  Boolean(entry && Date.now() - entry.createdAt <= TTL_MS);

const pruneMemory = (): void => {
  const entries = [...memoryCache.values()].sort(
    (left, right) => right.createdAt - left.createdAt,
  );
  entries.forEach((entry, index) => {
    if (!fresh(entry) || index >= MAX_ENTRIES) memoryCache.delete(entry.key);
  });
};

export const getCachedPvPRosterEvaluation = async (
  key: string,
): Promise<PokemonPvPRosterEvaluationResponse | null> => {
  const memory = memoryCache.get(key);
  if (fresh(memory)) return memory.response;
  if (memory) memoryCache.delete(key);

  try {
    const database = await getDatabase();
    if (!database) return null;
    const stored = await database.get(STORE_NAME, key);
    if (!fresh(stored)) {
      if (stored) await database.delete(STORE_NAME, key);
      return null;
    }
    memoryCache.set(key, stored);
    pruneMemory();
    return stored.response;
  } catch (error) {
    log.warn('Failed to read the personal PvP cache', error);
    return null;
  }
};

export const setCachedPvPRosterEvaluation = async (
  key: string,
  response: PokemonPvPRosterEvaluationResponse,
): Promise<void> => {
  const entry: CacheEntry = { key, response, createdAt: Date.now() };
  memoryCache.set(key, entry);
  pruneMemory();

  try {
    const database = await getDatabase();
    if (!database) return;
    await database.put(STORE_NAME, entry);
    const entries = await database.getAll(STORE_NAME);
    const stale = entries
      .sort((left, right) => right.createdAt - left.createdAt)
      .filter((candidate, index) => !fresh(candidate) || index >= MAX_ENTRIES);
    await Promise.all(
      stale.map((candidate) => database.delete(STORE_NAME, candidate.key)),
    );
  } catch (error) {
    log.warn('Failed to write the personal PvP cache', error);
  }
};

export const resetPvPRosterEvaluationMemoryCache = (): void => {
  memoryCache.clear();
};
