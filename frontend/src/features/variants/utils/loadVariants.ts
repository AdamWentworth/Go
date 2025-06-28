// loadVariants.ts
import {
    getAllFromDB,
    getAllPokedexListsFromDB,
    storePokedexListsInIndexedDB,
  } from '@/db/indexedDB';
import sortPokedexLists from './sortPokedexLists';
import { isDataFresh } from '@/utils/cacheHelpers';
import { formatTimeAgo } from '@/utils/formattingHelpers';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { PokedexLists } from '@/types/pokedex'
import { logSize } from '@/utils/loggers';
import { fetchAndProcessVariants } from './fetchAndProcessVariants';

export async function loadVariants() {
  console.log('Fetching data from API or cache...');

  const variantsTimestamp = parseInt(localStorage.getItem('variantsTimestamp') || '0', 10);
  const pokedexListsTimestamp = parseInt(localStorage.getItem('pokedexListsTimestamp') || '0', 10);

  const variantsFresh = !!variantsTimestamp && isDataFresh(variantsTimestamp);
  const pokedexFresh = !!pokedexListsTimestamp && isDataFresh(pokedexListsTimestamp);

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
      getAllFromDB<PokemonVariant>('pokemonVariants'),   
      getAllPokedexListsFromDB()
    ]);
    const elapsed = Date.now() - t0;

    console.log(`Retrieved both from IndexedDB in ${elapsed} ms`);

    variants = variantsFromDB;
    pokedexLists = pokedexFromDB;
    logSize('cached variants', variants);
    logSize('pokedex lists', pokedexLists);
  } else {
    if (variantsFresh) {
      console.log('Using cached variants');
      const t0 = Date.now();
      variants = await getAllFromDB('pokemonVariants');
      console.log(`Retrieved variants from IndexedDB in ${Date.now() - t0} ms`);
      logSize('cached variants', variants);
    } else {
      console.log('Variants are stale or missing, updating...');
      variants = await fetchAndProcessVariants();
    }

    console.log('PokedexLists are stale or variants updated, regenerating...');
    pokedexLists = sortPokedexLists(variants);
    try {
      await storePokedexListsInIndexedDB(pokedexLists);
      localStorage.setItem('pokedexListsTimestamp', Date.now().toString());
      listsBuiltNow = true;
      console.log('Successfully stored new PokedexLists in PokedexListsDB');
    } catch (error) {
      console.error('Failed to store PokedexLists in PokedexListsDB:', error);
    }

    logSize('new pokedex lists', pokedexLists);
  }

  console.log(`Returning ${variants.length} variants and corresponding pokedex lists.`);
  return { variants, pokedexLists, listsBuiltNow }; // ← ✅ include this new flag
}
