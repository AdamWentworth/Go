// db/pokedexListsDB.ts

import { initPokedexListsDB } from './init';
import { POKEDEX_LISTS_STORES } from './constants';
import type { PokemonVariant } from '../types/pokemonVariants';
export type PokedexVariant = PokemonVariant;

export async function storePokedexListsInIndexedDB(
  pokedexLists: { [storeName: string]: PokedexVariant[] }
): Promise<void> {
  const db = await initPokedexListsDB();
  if (!db) {
    console.warn("PokedexListsDB not available; cannot store lists data.");
    return;
  }
  const storeNames: string[] = Object.keys(pokedexLists);
  const tx = db.transaction(storeNames, 'readwrite');

  try {
    const listsSize: number = new Blob([JSON.stringify(pokedexLists)]).size;
    console.log(
      `storePokedexListsInIndexedDB: Storing lists with keys: [${storeNames.join(', ')}], total size: ${listsSize} bytes`
    );
  } catch (err) {
    console.log('Error measuring size in storePokedexListsInIndexedDB:', err);
  }

  for (const storeName of storeNames) {
    const store = tx.objectStore(storeName);
    await store.clear();
    for (const variant of pokedexLists[storeName]) {
      await store.put(variant);
    }
  }

  await tx.done;
  console.log("storePokedexListsInIndexedDB: Finished saving all lists.");
}

export async function getAllPokedexListsFromDB(): Promise<{ [storeName: string]: PokedexVariant[] }> {
  const db = await initPokedexListsDB();
  if (!db) {
    console.warn("PokedexListsDB not available; cannot read lists data.");
    return {};
  }
  const tx = db.transaction(POKEDEX_LISTS_STORES, 'readonly');
  const result: { [storeName: string]: PokedexVariant[] } = {};

  for (const storeName of POKEDEX_LISTS_STORES) {
    const store = tx.objectStore(storeName);
    const variants: PokedexVariant[] = await store.getAll();
    result[storeName] = variants;
  }

  await tx.done;

  try {
    const listsSize: number = new Blob([JSON.stringify(result)]).size;
    console.log(
      `getAllPokedexListsFromDB: Retrieved Pokedex lists with total size: ${listsSize} bytes`
    );
  } catch (err) {
    console.log('Error measuring combined lists size in getAllPokedexListsFromDB:', err);
  }

  return result;
}