import { getPokemons } from "@/services/pokemonDataService";
import { logSize } from "@/utils/loggers";
import createPokemonVariants from "@/features/variants/utils/createPokemonVariants";
import { getAllVariants, queueVariantsPersist } from "@/db/variantsDB";
import { recordVariantPipelineMetrics } from "@/utils/perfTelemetry";
import type { PokemonVariant } from "@/types/pokemonVariants";
import { computePayloadHash } from "@/features/variants/utils/payloadHash";

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
  const pipelineStart = performance.now();

  const t0 = Date.now();
  const pokemons = await getPokemons();
  const fetchedMs = performance.now() - pipelineStart;
  if (isDev) console.log(`Fetched new Pokemon data from API in ${Date.now() - t0} ms`);

  if (!Array.isArray(pokemons)) {
    throw new Error(
      `[fetchAndProcessVariants] expected array from getPokemons(), got ${typeof pokemons}`
    );
  }

  logSize('newly fetched Pokemon data', pokemons);

  const payloadHash = computePayloadHash(pokemons);
  const previousPayloadHash = localStorage.getItem('variantsPayloadHash');
  const payloadUnchanged = previousPayloadHash != null && previousPayloadHash === payloadHash;

  if (payloadUnchanged) {
    const cachedVariants = await getAllVariants<PokemonVariant>();
    if (cachedVariants.length > 0) {
      // We confirmed API payload equivalence with cached data.
      localStorage.setItem('variantsTimestamp', String(Date.now()));
      const totalMs = performance.now() - pipelineStart;

      recordVariantPipelineMetrics({
        fetchedMs,
        transformMs: 0,
        persistMs: 0,
        totalMs,
        variantCount: cachedVariants.length,
      });

      if (isDev) {
        console.log(`[variants] payload unchanged (hash=${payloadHash}), using cached variants`);
      }
      return cachedVariants;
    }
  }

  const t1 = Date.now();
  const transformStart = performance.now();
  const variants = createPokemonVariants(pokemons);
  const transformMs = performance.now() - transformStart;

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
  const persistStart = performance.now();
  queueVariantsPersist(variants, Date.now(), payloadHash);
  const persistMs = performance.now() - persistStart;
  if (isDev) console.log(`Queued variants persistence in ${Date.now() - t2} ms`);
  const totalMs = performance.now() - pipelineStart;

  recordVariantPipelineMetrics({
    fetchedMs,
    transformMs,
    persistMs,
    totalMs,
    variantCount: variants.length,
  });

  return variants;
}
