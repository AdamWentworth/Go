/* variantsDB.ts ----------------------------------------------------------- */
import { initVariantsDB } from './init';
import { VARIANTS_STORE } from './constants';
import type { IDBPDatabase } from 'idb';
import type { PokemonVariant } from '@/types/pokemonVariants';

export async function putVariantsBulk<T>(data: T[]) {
  const db = await initVariantsDB();
  if (!db) return;
  const tx    = db.transaction(VARIANTS_STORE, 'readwrite');
  const store = tx.objectStore(VARIANTS_STORE);
  data.forEach((d) => store.put(d));
  await tx.done;
}

export async function getAllVariants<T>() {
  const db = await initVariantsDB();
  return db ? (db.getAll(VARIANTS_STORE) as Promise<T[]>) : [];
}

export async function getVariantById<
  T extends PokemonVariant = PokemonVariant
>(variantId: string): Promise<T | null> {
  const db = await initVariantsDB();
  return db ? (db.get(VARIANTS_STORE, variantId) as Promise<T | null>) : null;
}
