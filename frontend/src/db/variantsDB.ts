/* variantsDB.ts ----------------------------------------------------------- */
import { initVariantsDB } from './init';
import { VARIANTS_STORE } from './constants';
import type { PokemonVariant } from '@/types/pokemonVariants';
import { recordVariantPersistCommitMetrics } from '@/utils/perfTelemetry';

export async function putVariantsBulk<T>(data: T[]) {
  const db = await initVariantsDB();
  if (!db) return;
  const tx = db.transaction(VARIANTS_STORE, 'readwrite');
  const store = tx.objectStore(VARIANTS_STORE);
  await store.clear();
  data.forEach((d) => store.put(d));
  await tx.done;
}

export async function getAllVariants<T>() {
  const db = await initVariantsDB();
  return db ? (db.getAll(VARIANTS_STORE) as Promise<T[]>) : [];
}

type QueuedVariantSnapshot<T> = {
  data: T[];
  timestamp: number;
  enqueuedAtMs: number;
  payloadHash?: string;
};

let queuedSnapshot: QueuedVariantSnapshot<unknown> | null = null;
let drainScheduled = false;
let drainInProgress = false;

function scheduleDrainQueue() {
  if (drainScheduled) return;
  drainScheduled = true;

  const run = () => {
    drainScheduled = false;
    void drainVariantPersistQueue();
  };

  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(run, { timeout: 300 });
    return;
  }

  setTimeout(run, 0);
}

async function drainVariantPersistQueue() {
  if (drainInProgress) return;
  drainInProgress = true;

  try {
    while (queuedSnapshot) {
      const current = queuedSnapshot;
      queuedSnapshot = null;

      const persistStartMs = performance.now();
      await putVariantsBulk(current.data as unknown[]);
      const persistCommittedMs = performance.now() - persistStartMs;
      const persistEndToEndMs = performance.now() - current.enqueuedAtMs;
      localStorage.setItem('variantsTimestamp', String(current.timestamp));
      if (current.payloadHash) {
        localStorage.setItem('variantsPayloadHash', current.payloadHash);
      }
      recordVariantPersistCommitMetrics({
        persistCommittedMs,
        persistEndToEndMs,
      });
    }
  } finally {
    drainInProgress = false;
  }
}

export function queueVariantsPersist<T>(
  data: T[],
  timestamp = Date.now(),
  payloadHash?: string,
) {
  // Keep only the newest full snapshot.
  queuedSnapshot = {
    data: [...data],
    timestamp,
    enqueuedAtMs: performance.now(),
    payloadHash,
  };
  scheduleDrainQueue();
}

export async function flushQueuedVariantsPersist() {
  await drainVariantPersistQueue();
}

export async function getVariantById<
  T extends PokemonVariant = PokemonVariant
>(variantId: string): Promise<T | null> {
  const db = await initVariantsDB();
  return db ? (db.get(VARIANTS_STORE, variantId) as Promise<T | null>) : null;
}
