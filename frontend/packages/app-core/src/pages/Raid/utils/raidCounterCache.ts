import type { PokemonVariant } from "@/types/pokemonVariants";
import type { Move } from "@/types/pokemonSubTypes";
import { createScopedLogger } from "@/utils/logger";
import {
  getStorageString,
  STORAGE_KEYS,
} from "@/utils/storage";
import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { getLegalRaidChargedMoves, getLegalRaidFastMoves } from "./raidCatalog";
import { RAID_SIMULATION_MODEL_VERSION } from "./raidRules";
import type {
  RaidCounterScore,
  RaidCounterSettings,
  RaidTierPreset,
} from "./raidTypes";

const RAID_COUNTER_CACHE_DB = "pokegonexus-raid-counter-cache";
const RAID_COUNTER_CACHE_STORE = "results";
const RAID_COUNTER_CACHE_DB_VERSION = 1;
const RAID_COUNTER_CACHE_MAX_ENTRIES = 12;
const RAID_COUNTER_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const log = createScopedLogger("raidCounterCache");

type RaidCounterCacheEntry = {
  key: string;
  fingerprint: string;
  createdAt: number;
  scores: RaidCounterScore[];
};

interface RaidCounterCacheSchema extends DBSchema {
  results: {
    key: string;
    value: RaidCounterCacheEntry;
    indexes: { "by-created-at": number };
  };
}

export type RaidCounterCacheRequest = {
  finalists: PokemonVariant[];
  boss: PokemonVariant;
  tier: RaidTierPreset;
  settings: RaidCounterSettings;
  bestOnly: boolean;
};

type RaidCounterCacheDescriptor = {
  key: string;
  fingerprint: string;
};

const memoryCache = new Map<string, RaidCounterCacheEntry>();
let databasePromise: Promise<IDBPDatabase<RaidCounterCacheSchema> | null> | null =
  null;

const moveSignature = (move: Move) => ({
  name: move.name,
  type: move.type_name || move.type,
  fast: move.is_fast,
  power: move.raid_power,
  cooldown: move.raid_cooldown,
  energy: move.raid_energy,
  fusionId: move.fusion_id ?? null,
});

const compareMoveSignatures = (
  a: ReturnType<typeof moveSignature>,
  b: ReturnType<typeof moveSignature>,
) =>
  String(a.name).localeCompare(String(b.name)) ||
  String(a.type).localeCompare(String(b.type));

const variantSignature = (variant: PokemonVariant) => ({
  id: variant.variant_id,
  pokemonId: variant.pokemon_id,
  kind: variant.variantType,
  attack: variant.attack,
  defense: variant.defense,
  stamina: variant.stamina,
  type1: variant.type1_name,
  type2: variant.type2_name,
  fastMoves: getLegalRaidFastMoves(variant)
    .map(moveSignature)
    .sort(compareMoveSignatures),
  chargedMoves: getLegalRaidChargedMoves(variant)
    .map(moveSignature)
    .sort(compareMoveSignatures),
});

const hashFingerprint = (value: string, seed: number): string => {
  let hash = seed >>> 0;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};

export const buildRaidCounterCacheDescriptor = ({
  finalists,
  boss,
  tier,
  settings,
  bestOnly,
}: RaidCounterCacheRequest): RaidCounterCacheDescriptor => {
  const catalogVersion =
    getStorageString(STORAGE_KEYS.pokemonCatalogVersion) ?? "unknown";
  const fingerprint = JSON.stringify({
    modelVersion: RAID_SIMULATION_MODEL_VERSION,
    catalogVersion,
    boss: variantSignature(boss),
    tier,
    settings,
    bestOnly,
    finalists: finalists
      .map(variantSignature)
      .sort((a, b) => String(a.id).localeCompare(String(b.id))),
  });
  const primaryHash = hashFingerprint(fingerprint, 2166136261);
  const secondaryHash = hashFingerprint(fingerprint, 2654435769);
  return {
    key: `v${RAID_SIMULATION_MODEL_VERSION}-${primaryHash}${secondaryHash}`,
    fingerprint,
  };
};

const getDatabase = async (): Promise<
  IDBPDatabase<RaidCounterCacheSchema> | null
> => {
  if (typeof indexedDB === "undefined") return null;
  if (!databasePromise) {
    databasePromise = openDB<RaidCounterCacheSchema>(
      RAID_COUNTER_CACHE_DB,
      RAID_COUNTER_CACHE_DB_VERSION,
      {
        upgrade(database) {
          if (!database.objectStoreNames.contains(RAID_COUNTER_CACHE_STORE)) {
            const store = database.createObjectStore(
              RAID_COUNTER_CACHE_STORE,
              { keyPath: "key" },
            );
            store.createIndex("by-created-at", "createdAt");
          }
        },
      },
    ).catch((error) => {
      log.warn("Raid simulation cache unavailable", error);
      databasePromise = null;
      return null;
    });
  }
  return databasePromise;
};

const entryMatches = (
  entry: RaidCounterCacheEntry | undefined,
  descriptor: RaidCounterCacheDescriptor,
  now: number,
): entry is RaidCounterCacheEntry =>
  Boolean(
    entry &&
      entry.fingerprint === descriptor.fingerprint &&
      now - entry.createdAt <= RAID_COUNTER_CACHE_TTL_MS,
  );

const pruneMemoryCache = (): void => {
  const expiredBefore = Date.now() - RAID_COUNTER_CACHE_TTL_MS;
  const entries = [...memoryCache.values()].sort(
    (a, b) => b.createdAt - a.createdAt,
  );
  entries.forEach((entry, index) => {
    if (
      entry.createdAt < expiredBefore ||
      index >= RAID_COUNTER_CACHE_MAX_ENTRIES
    ) {
      memoryCache.delete(entry.key);
    }
  });
};

export const getCachedRaidCounterScores = async (
  request: RaidCounterCacheRequest,
): Promise<RaidCounterScore[] | null> => {
  const descriptor = buildRaidCounterCacheDescriptor(request);
  const now = Date.now();
  const memoryEntry = memoryCache.get(descriptor.key);
  if (entryMatches(memoryEntry, descriptor, now)) {
    return memoryEntry.scores;
  }
  if (memoryEntry) memoryCache.delete(descriptor.key);

  try {
    const database = await getDatabase();
    if (!database) return null;
    const storedEntry = await database.get(
      RAID_COUNTER_CACHE_STORE,
      descriptor.key,
    );
    if (entryMatches(storedEntry, descriptor, now)) {
      memoryCache.set(descriptor.key, storedEntry);
      pruneMemoryCache();
      return storedEntry.scores;
    }
    if (storedEntry) {
      await database.delete(RAID_COUNTER_CACHE_STORE, descriptor.key);
    }
  } catch (error) {
    log.warn("Failed to read the Raid simulation cache", error);
  }
  return null;
};

const prunePersistentCache = async (
  database: IDBPDatabase<RaidCounterCacheSchema>,
): Promise<void> => {
  const entries = await database.getAll(RAID_COUNTER_CACHE_STORE);
  const expiredBefore = Date.now() - RAID_COUNTER_CACHE_TTL_MS;
  const staleEntries = entries
    .filter((entry) => entry.createdAt < expiredBefore)
    .map((entry) => entry.key);
  const retainedEntries = entries
    .filter((entry) => entry.createdAt >= expiredBefore)
    .sort((a, b) => b.createdAt - a.createdAt);
  const overflowEntries = retainedEntries
    .slice(RAID_COUNTER_CACHE_MAX_ENTRIES)
    .map((entry) => entry.key);
  const keysToDelete = [...new Set([...staleEntries, ...overflowEntries])];
  if (keysToDelete.length === 0) return;

  const transaction = database.transaction(
    RAID_COUNTER_CACHE_STORE,
    "readwrite",
  );
  await Promise.all([
    ...keysToDelete.map((key) => transaction.store.delete(key)),
    transaction.done,
  ]);
};

export const setCachedRaidCounterScores = async (
  request: RaidCounterCacheRequest,
  scores: RaidCounterScore[],
): Promise<void> => {
  const descriptor = buildRaidCounterCacheDescriptor(request);
  const entry: RaidCounterCacheEntry = {
    ...descriptor,
    createdAt: Date.now(),
    scores,
  };
  memoryCache.set(descriptor.key, entry);
  pruneMemoryCache();

  try {
    const database = await getDatabase();
    if (!database) return;
    await database.put(RAID_COUNTER_CACHE_STORE, entry);
    await prunePersistentCache(database);
  } catch (error) {
    log.warn("Failed to write the Raid simulation cache", error);
  }
};

export const resetRaidCounterMemoryCache = (): void => {
  memoryCache.clear();
};

export const clearRaidCounterSimulationCache = async (): Promise<void> => {
  resetRaidCounterMemoryCache();
  try {
    const database = await getDatabase();
    await database?.clear(RAID_COUNTER_CACHE_STORE);
  } catch (error) {
    log.warn("Failed to clear the Raid simulation cache", error);
  }
};
