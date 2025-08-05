// src/features/variants/utils/loadVariants.ts

import { getAllVariants } from '@/db/variantsDB';
import {
  getAllPokedex,
  putPokedexCategory,
} from '@/db/pokedexDB';
import sortPokedexLists from './sortPokedexLists';
import { isDataFresh } from '@/utils/cacheHelpers';
import { formatTimeAgo } from '@/utils/formattingHelpers';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { PokedexLists } from '@/types/pokedex';
import { logSize } from '@/utils/loggers';
import { fetchAndProcessVariants } from './fetchAndProcessVariants';
import { POKEDEX_STORES } from '@/db/constants';

/**
 * Store all generated Pokedex lists in IndexedDB (one object-store per category).
 */
async function storePokedexLists(lists: PokedexLists): Promise<void> {
  const ops: Promise<void>[] = [];
  for (const category of POKEDEX_STORES) {
    ops.push(
      putPokedexCategory(category, lists[category as keyof PokedexLists]),
    );
  }
  await Promise.all(ops);
}

export async function loadVariants() {
  console.log('Fetching data from API or cache...');

  const variantsTimestamp      = Number(localStorage.getItem('variantsTimestamp') || 0);
  const pokedexListsTimestamp  = Number(localStorage.getItem('pokedexListsTimestamp') || 0);

  const variantsFresh = variantsTimestamp && isDataFresh(variantsTimestamp);
  const pokedexFresh  = pokedexListsTimestamp && isDataFresh(pokedexListsTimestamp);

  const logAge = (label: string, t: number) =>
    console.log(t ? `${label} Age: ${formatTimeAgo(t)}` : `${label} data is missing.`);

  logAge('Cached Variants', variantsTimestamp);
  logAge('Cached PokedexLists', pokedexListsTimestamp);

  let variants: PokemonVariant[];
  let pokedexLists: PokedexLists;
  let listsBuiltNow = false;

  if (variantsFresh && pokedexFresh) {
    console.log('Using cached variants and PokedexLists...');
    const t0 = Date.now();

    const [variantsFromDB, pokedexFromDB] = await Promise.all([
      getAllVariants<PokemonVariant>(),
      getAllPokedex(),
    ]);

    console.log(`Retrieved both from IndexedDB in ${Date.now() - t0} ms`);

    variants     = variantsFromDB;
    pokedexLists = pokedexFromDB;

    logSize('cached variants', variants);
    logSize('pokedex lists', pokedexLists);
  } else {
    /* -------------------------------------------------------------- */
    /*  Variants                                                      */
    /* -------------------------------------------------------------- */
    if (variantsFresh) {
      console.log('Using cached variants');
      const t0   = Date.now();
      variants   = await getAllVariants();
      console.log(`Retrieved variants from IndexedDB in ${Date.now() - t0} ms`);
      logSize('cached variants', variants);
    } else {
      console.log('Variants are stale or missing, updating...');
      variants = await fetchAndProcessVariants();
    }

    /* -------------------------------------------------------------- */
    /*  Pokedex lists                                                 */
    /* -------------------------------------------------------------- */
    console.log('PokedexLists are stale or variants updated, regenerating...');
    pokedexLists = sortPokedexLists(variants);

    try {
      await storePokedexLists(pokedexLists);
      localStorage.setItem('pokedexListsTimestamp', Date.now().toString());
      listsBuiltNow = true;
      console.log('Successfully stored new PokedexLists in IndexedDB');
    } catch (error) {
      console.error('Failed to store PokedexLists:', error);
    }

    logSize('new pokedex lists', pokedexLists);
  }

  console.log(`Returning ${variants.length} variants and corresponding pokedex lists.`);
  return { variants, pokedexLists, listsBuiltNow };
}
