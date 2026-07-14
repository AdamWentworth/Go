import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/variants/utils/fetchAndProcessVariants', () => ({
  fetchAndProcessVariants: vi.fn(),
}));

vi.mock('@/services/pokemonDataService', () => ({
  getPokemonCatalogManifest: vi.fn(),
}));

import { loadVariants } from '@/features/variants/utils/loadVariants';
import { fetchAndProcessVariants } from '@/features/variants/utils/fetchAndProcessVariants';
import { getPokemonCatalogManifest } from '@/services/pokemonDataService';
import { initVariantsDB, initPokedexDB } from '@/db/init';
import { VARIANTS_STORE, POKEDEX_STORES } from '@/db/constants';
import { getAllPokedex } from '@/db/pokedexDB';
import sortPokedexLists from '@/features/variants/utils/sortPokedexLists';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { PokemonCatalogManifest } from '@shared-contracts/pokemon';
import variantsFixture from '@/../tests/__helpers__/fixtures/variants.json';

async function clearVariantAndPokedexCaches() {
  const variantsDB = await initVariantsDB();
  if (variantsDB) await variantsDB.clear(VARIANTS_STORE);

  const pokedexDB = await initPokedexDB();
  if (pokedexDB) {
    await Promise.all(POKEDEX_STORES.map((store) => pokedexDB.clear(store)));
  }

  localStorage.removeItem('variantsTimestamp');
  localStorage.removeItem('pokedexListsTimestamp');
}

async function persistVariants(variants: PokemonVariant[]) {
  const variantsDB = await initVariantsDB();
  if (!variantsDB) return;

  const tx = variantsDB.transaction(VARIANTS_STORE, 'readwrite');
  for (const variant of variants) tx.store.put(variant);
  await tx.done;
}

async function persistPokedexLists(lists: ReturnType<typeof sortPokedexLists>) {
  const pokedexDB = await initPokedexDB();
  if (!pokedexDB) return;

  await Promise.all(
    POKEDEX_STORES.map(async (store) => {
      const tx = pokedexDB.transaction(store, 'readwrite');
      await tx.store.clear();
      for (const variant of lists[store] ?? []) tx.store.put(variant);
      await tx.done;
    }),
  );
}

describe.sequential('loadVariants (integration)', () => {
  const manifest: PokemonCatalogManifest = {
    schemaVersion: 1,
    catalogVersion: 'catalog-v1',
    generatedAt: '2026-07-14T00:00:00Z',
    chunks: {
      pokemonFull: {
        name: 'pokemonFull',
        endpoint: '/pokemon/pokemons',
        contentType: 'application/json',
        etag: '"catalog-v1"',
        version: 'catalog-v1',
        bytesJson: 100,
        bytesGzip: 50,
      },
    },
  };
  const freshVariants = (variantsFixture as PokemonVariant[]).slice(0, 50).map((variant, idx) => ({
    ...variant,
    variant_id:
      (variant as any).variant_id ??
      `${String(variant.pokemon_id).padStart(4, '0')}-${variant.variantType}-${idx}`,
  }));
  const staleTimestamp = Date.now() - 1000 * 60 * 60 * 48; // 48h

  beforeEach(async () => {
    vi.clearAllMocks();
    await clearVariantAndPokedexCaches();
    localStorage.removeItem('pokemonCatalogVersion');
    localStorage.removeItem('pokedexListsCatalogVersion');
    vi.mocked(getPokemonCatalogManifest).mockResolvedValue(manifest);
    vi.mocked(fetchAndProcessVariants).mockResolvedValue(freshVariants);
  });

  it('cold start: fetches/processes variants and builds pokedex lists', async () => {
    const result = await loadVariants();
    const persistedLists = await getAllPokedex();

    expect(fetchAndProcessVariants).toHaveBeenCalledWith({ manifest });
    expect(result.variants.length).toBe(freshVariants.length);
    expect(result.listsBuiltNow).toBe(true);
    expect(Object.values(persistedLists).flat().length).toBe(freshVariants.length);
    expect(localStorage.getItem('pokedexListsTimestamp')).toBeTruthy();
    expect(localStorage.getItem('pokedexListsCatalogVersion')).toBe(manifest.catalogVersion);
  });

  it('warm cache: uses IndexedDB only and skips fetch path', async () => {
    const lists = sortPokedexLists(freshVariants);
    await persistVariants(freshVariants);
    await persistPokedexLists(lists);

    localStorage.setItem('variantsTimestamp', Date.now().toString());
    localStorage.setItem('pokedexListsTimestamp', Date.now().toString());
    localStorage.setItem('pokemonCatalogVersion', manifest.catalogVersion);
    localStorage.setItem('pokedexListsCatalogVersion', manifest.catalogVersion);

    const result = await loadVariants();

    expect(fetchAndProcessVariants).not.toHaveBeenCalled();
    expect(result.listsBuiltNow).toBe(false);
    expect(result.variants.length).toBe(freshVariants.length);
  });

  it('versioned warm cache: skips fetch even when timestamps are older than the TTL', async () => {
    const lists = sortPokedexLists(freshVariants);
    await persistVariants(freshVariants);
    await persistPokedexLists(lists);

    localStorage.setItem('variantsTimestamp', staleTimestamp.toString());
    localStorage.setItem('pokedexListsTimestamp', staleTimestamp.toString());
    localStorage.setItem('pokemonCatalogVersion', manifest.catalogVersion);
    localStorage.setItem('pokedexListsCatalogVersion', manifest.catalogVersion);

    const result = await loadVariants();

    expect(fetchAndProcessVariants).not.toHaveBeenCalled();
    expect(result.listsBuiltNow).toBe(false);
    expect(result.variants.length).toBe(freshVariants.length);
  });

  it('catalog version change: fetches fresh variants even when timestamps are fresh', async () => {
    localStorage.setItem('variantsTimestamp', Date.now().toString());
    localStorage.setItem('pokedexListsTimestamp', Date.now().toString());
    localStorage.setItem('pokemonCatalogVersion', 'old-catalog');
    localStorage.setItem('pokedexListsCatalogVersion', 'old-catalog');

    const result = await loadVariants();

    expect(fetchAndProcessVariants).toHaveBeenCalledWith({ manifest });
    expect(result.variants.length).toBe(freshVariants.length);
    expect(result.listsBuiltNow).toBe(true);
  });

  it('stale lists only: rebuilds lists from cached variants without refetching variants', async () => {
    await persistVariants(freshVariants);

    localStorage.setItem('variantsTimestamp', Date.now().toString());
    localStorage.setItem('pokedexListsTimestamp', staleTimestamp.toString());
    localStorage.setItem('pokemonCatalogVersion', manifest.catalogVersion);

    const result = await loadVariants();

    expect(fetchAndProcessVariants).not.toHaveBeenCalled();
    expect(result.listsBuiltNow).toBe(true);
    expect(Object.values(result.pokedexLists).flat().length).toBe(freshVariants.length);
    expect(Number(localStorage.getItem('pokedexListsTimestamp'))).toBeGreaterThan(staleTimestamp);
  });

  it('uses timestamp freshness when the manifest endpoint is unavailable', async () => {
    const lists = sortPokedexLists(freshVariants);
    await persistVariants(freshVariants);
    await persistPokedexLists(lists);

    localStorage.setItem('variantsTimestamp', Date.now().toString());
    localStorage.setItem('pokedexListsTimestamp', Date.now().toString());
    vi.mocked(getPokemonCatalogManifest).mockRejectedValueOnce(new Error('manifest unavailable'));

    const result = await loadVariants();

    expect(fetchAndProcessVariants).not.toHaveBeenCalled();
    expect(result.listsBuiltNow).toBe(false);
    expect(result.variants).toHaveLength(freshVariants.length);
  });
});
