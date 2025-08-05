// db/pokedexDB.ts
import { initPokedexDB } from './init';
import { POKEDEX_STORES } from './constants';
import type { PokemonVariant } from '@/types/pokemonVariants';

export type PokedexVariant = PokemonVariant;

/* replace an entire category */
export async function putPokedexCategory(
  store: typeof POKEDEX_STORES[number],
  variants: PokedexVariant[],
): Promise<void> {
  const db = await initPokedexDB();
  if (!db) return;

  const tx = db.transaction(store, 'readwrite');
  const s = tx.objectStore(store);
  await s.clear();
  variants.forEach(v => s.put(v));
  await tx.done;
}

/* read the whole pokedex */
export async function getAllPokedex(): Promise<
  Record<typeof POKEDEX_STORES[number], PokedexVariant[]>
> {
  const db = await initPokedexDB();
  if (!db) {
    // build a properly-typed empty record
    const empty = POKEDEX_STORES.reduce(
      (acc, key) => {
        acc[key] = [] as PokedexVariant[];
        return acc;
      },
      {} as Record<typeof POKEDEX_STORES[number], PokedexVariant[]>
    );
    return empty;
  }

  const tx  = db.transaction(POKEDEX_STORES, 'readonly');
  const out = {} as Record<typeof POKEDEX_STORES[number], PokedexVariant[]>;
  for (const store of POKEDEX_STORES) {
    out[store] = await tx.objectStore(store).getAll();
  }
  await tx.done;
  return out;
}
