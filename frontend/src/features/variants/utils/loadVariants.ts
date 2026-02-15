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
import { createScopedLogger } from '@/utils/logger';

let derivedListsMemo: { key: string; lists: PokedexLists } | null = null;
const log = createScopedLogger('loadVariants');

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

function getDerivedListsMemoKey(variants: PokemonVariant[], variantsTimestamp: number): string {
  // Timestamp changes whenever variants are refreshed; length is a cheap safety discriminator.
  return `${variantsTimestamp}:${variants.length}`;
}

function getOrBuildPokedexLists(variants: PokemonVariant[], variantsTimestamp: number): PokedexLists {
  const memoKey = getDerivedListsMemoKey(variants, variantsTimestamp);
  if (derivedListsMemo?.key === memoKey) {
    return derivedListsMemo.lists;
  }

  const lists = sortPokedexLists(variants);
  derivedListsMemo = { key: memoKey, lists };
  return lists;
}

export async function loadVariants() {
  log.debug('Fetching data from API or cache...');

  const variantsTimestamp      = Number(localStorage.getItem('variantsTimestamp') || 0);
  const pokedexListsTimestamp  = Number(localStorage.getItem('pokedexListsTimestamp') || 0);

  const variantsFresh = variantsTimestamp && isDataFresh(variantsTimestamp);
  const pokedexFresh  = pokedexListsTimestamp && isDataFresh(pokedexListsTimestamp);

  const logAge = (label: string, t: number) =>
    log.debug(t ? `${label} Age: ${formatTimeAgo(t)}` : `${label} data is missing.`);

  logAge('Cached Variants', variantsTimestamp);
  logAge('Cached PokedexLists', pokedexListsTimestamp);

  let variants: PokemonVariant[];
  let pokedexLists: PokedexLists;
  let listsBuiltNow = false;

  if (variantsFresh && pokedexFresh) {
    log.debug('Using cached variants and PokedexLists...');
    const t0 = Date.now();

    const [variantsFromDB, pokedexFromDB] = await Promise.all([
      getAllVariants<PokemonVariant>(),
      getAllPokedex(),
    ]);

    log.debug(`Retrieved both from IndexedDB in ${Date.now() - t0} ms`);

    variants     = variantsFromDB;
    pokedexLists = pokedexFromDB;

    logSize('cached variants', variants);
    logSize('pokedex lists', pokedexLists);
  } else {
    /* -------------------------------------------------------------- */
    /*  Variants                                                      */
    /* -------------------------------------------------------------- */
    if (variantsFresh) {
      log.debug('Using cached variants');
      const t0   = Date.now();
      variants   = await getAllVariants();
      log.debug(`Retrieved variants from IndexedDB in ${Date.now() - t0} ms`);
      logSize('cached variants', variants);
    } else {
      log.debug('Variants are stale or missing, updating...');
      variants = await fetchAndProcessVariants();
    }

    /* -------------------------------------------------------------- */
    /*  Pokedex lists                                                 */
    /* -------------------------------------------------------------- */
    log.debug('PokedexLists are stale or variants updated, regenerating...');
    const currentVariantsTimestamp =
      Number(localStorage.getItem('variantsTimestamp') || variantsTimestamp || 0);
    pokedexLists = getOrBuildPokedexLists(variants, currentVariantsTimestamp);

    try {
      await storePokedexLists(pokedexLists);
      localStorage.setItem('pokedexListsTimestamp', Date.now().toString());
      listsBuiltNow = true;
      log.debug('Successfully stored new PokedexLists in IndexedDB');
    } catch (error) {
      log.error('Failed to store PokedexLists', error);
    }

    logSize('new pokedex lists', pokedexLists);
  }

  log.debug(`Returning ${variants.length} variants and corresponding pokedex lists.`);
  return { variants, pokedexLists, listsBuiltNow };
}
