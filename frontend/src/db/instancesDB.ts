/* instancesDB.ts ---------------------------------------------------------- */
import { initInstancesDB } from './init';
import { INSTANCES_STORE } from './constants';

/**
 * Insert or update many Pokémon-instance records in one transaction.
 */
export async function putInstancesBulk<T>(data: T[]): Promise<void> {
  const db = await initInstancesDB();
  if (!db) return;

  const tx    = db.transaction(INSTANCES_STORE, 'readwrite');
  const store = tx.objectStore(INSTANCES_STORE);
  data.forEach((d) => store.put(d));
  await tx.done;
}

/**
 * Retrieve every record from the instances store.
 */
export async function getAllInstances<T>(): Promise<T[]> {
  const db = await initInstancesDB();
  return db ? (db.getAll(INSTANCES_STORE) as Promise<T[]>) : [];
}

/**
 * **Nuke the instances store** – removes _all_ instance records.
 * Useful when you need to repopulate the cache from scratch.
 */
export async function clearInstancesStore(): Promise<void> {
  const db = await initInstancesDB();
  if (!db) return;
  await db.clear(INSTANCES_STORE);
}
