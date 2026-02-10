import { getPokemons } from "@/services/pokemonDataService";
import { logSize } from "@/utils/loggers";
import createPokemonVariants from "@/features/variants/utils/createPokemonVariants";
import { useImageStore } from '@/stores/useImageStore';
import { putVariantsBulk } from "@/db/variantsDB";
import type { PokemonVariant } from "@/types/pokemonVariants";

const isDev = process.env.NODE_ENV === 'development';

function assertVariantIds(variants: PokemonVariant[]): void {
  const seen = new Set<string>();
  const missing: number[] = [];
  const duplicates: string[] = [];

  variants.forEach((v, idx) => {
    const id = String(v.variant_id ?? '').trim();
    if (!id) {
      missing.push(idx);
      return;
    }
    if (seen.has(id)) {
      duplicates.push(id);
      return;
    }
    seen.add(id);
  });

  if (missing.length || duplicates.length) {
    const duplicatePreview = Array.from(new Set(duplicates)).slice(0, 5).join(', ');
    throw new Error(
      `[variants] invalid variant_id set: missing=${missing.length}, duplicates=${duplicates.length}` +
        (duplicatePreview ? ` [${duplicatePreview}]` : ''),
    );
  }
}

export async function fetchAndProcessVariants() {
  if (isDev) console.log('Fetching new data from API');

  const t0 = Date.now();
  const pokemons = await getPokemons();
  if (isDev) console.log(`Fetched new Pokemon data from API in ${Date.now() - t0} ms`);

  if (!Array.isArray(pokemons)) {
    throw new Error(
      `[fetchAndProcessVariants] expected array from getPokemons(), got ${typeof pokemons}`
    );
  }

  logSize('newly fetched Pokemon data', pokemons);

  const t1 = Date.now();
  const variants = createPokemonVariants(pokemons);

  const { preload } = useImageStore.getState();
  variants.forEach(v => {
    if (v.currentImage) preload(v.currentImage, v.currentImage);
    if ((v as any).type_1_icon) preload((v as any).type_1_icon, (v as any).type_1_icon);
    if ((v as any).type_2_icon) preload((v as any).type_2_icon, (v as any).type_2_icon);
  });

  // Guard before persistence: variant_id must be non-empty and unique.
  assertVariantIds(variants as PokemonVariant[]);

  if (isDev) console.log(`Processed Pokemon into variants in ${Date.now() - t1} ms`);

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
