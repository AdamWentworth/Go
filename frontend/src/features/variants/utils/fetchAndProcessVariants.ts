// fetchAndProcessVariants.ts

import { getPokemons } from "@/services/pokemonDataService";
import { logSize } from "@/utils/loggers";
import createPokemonVariants from "@/features/variants/utils/createPokemonVariants";
import { determinePokemonKey } from "@/utils/PokemonIDUtils";
import { useImageStore } from '@/stores/useImageStore';
import { putVariantsBulk } from "@/db/variantsDB";

const isDev = process.env.NODE_ENV === 'development';

export async function fetchAndProcessVariants() {
  if (isDev) console.log('Fetching new data from API');

  const t0 = Date.now();
  const pokemons = await getPokemons();
  if (isDev) console.log(`Fetched new Pokémon data from API in ${Date.now() - t0} ms`);

  logSize('newly fetched Pokémon data', pokemons); // you can make logSize respect NODE_ENV too if needed

  const t1 = Date.now();
  const variants = createPokemonVariants(pokemons);

  const { preload } = useImageStore.getState();
  variants.forEach(v => {
    v.pokemonKey = determinePokemonKey(v);

    if (v.currentImage) preload(v.currentImage, v.currentImage);
    if (v.type_1_icon) preload(v.type_1_icon, v.type_1_icon);
    if (v.type_2_icon) preload(v.type_2_icon, v.type_2_icon);
  });

  if (isDev) console.log(`Processed Pokémon into variants in ${Date.now() - t1} ms`);

  try {
    const size = new Blob([JSON.stringify(variants)]).size;
    if (isDev) console.log(`Size of processed variants in bytes: ${size}`);
  } catch (err) {
    if (isDev) console.log('Error measuring size of processed variants:', err);
  }

  const t2 = Date.now();
  await putVariantsBulk(variants);
  if (isDev) console.log(`Stored variants in IndexedDB in ${Date.now() - t2} ms`);

  localStorage.setItem('variantsTimestamp', Date.now().toString());
  if (isDev) console.log('Stored updated variants in IndexedDB');

  return variants;
}