import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/variants/utils/fetchAndProcessVariants', () => ({
  fetchAndProcessVariants: vi.fn(),
}));

import { loadVariants } from '@/features/variants/utils/loadVariants';
import { fetchAndProcessVariants } from '@/features/variants/utils/fetchAndProcessVariants';
import { initVariantsDB, initPokedexDB } from '@/db/init';
import { VARIANTS_STORE, POKEDEX_STORES } from '@/db/constants';
import { getAllPokedex } from '@/db/pokedexDB';
import sortPokedexLists from '@/features/variants/utils/sortPokedexLists';
import type { PokemonVariant } from '@/types/pokemonVariants';
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

describe.sequential('loadVariants (integration)', () => {
  const freshVariants = (variantsFixture as PokemonVariant[]).slice(0, 50).map((variant, idx) => ({
    ...variant,
    variant_id:
      (variant as any).variant_id ??
      (variant as any).pokemonKey ??
      `${String(variant.pokemon_id).padStart(4, '0')}-${variant.variantType}-${idx}`,
  }));
  const staleTimestamp = Date.now() - 1000 * 60 * 60 * 48; // 48h

  beforeEach(async () => {
    vi.clearAllMocks();
    await clearVariantAndPokedexCaches();
    vi.mocked(fetchAndProcessVariants).mockResolvedValue(freshVariants);
  });

  it('cold start: fetches/processes variants and builds pokedex lists', async () => {
    const result = await loadVariants();
    const persistedLists = await getAllPokedex();

    expect(fetchAndProcessVariants).toHaveBeenCalled();
    expect(result.variants.length).toBe(freshVariants.length);
    expect(result.listsBuiltNow).toBe(true);
    expect(Object.values(persistedLists).flat().length).toBe(freshVariants.length);
    expect(localStorage.getItem('pokedexListsTimestamp')).toBeTruthy();
  });

  it('warm cache: uses IndexedDB only and skips fetch path', async () => {
    const lists = sortPokedexLists(freshVariants);

    const variantsDB = await initVariantsDB();
    if (variantsDB) {
      const tx = variantsDB.transaction(VARIANTS_STORE, 'readwrite');
      for (const variant of freshVariants) tx.store.put(variant);
      await tx.done;
    }

    const pokedexDB = await initPokedexDB();
    if (pokedexDB) {
      await Promise.all(
        POKEDEX_STORES.map(async (store) => {
          const tx = pokedexDB.transaction(store, 'readwrite');
          await tx.store.clear();
          for (const variant of lists[store] ?? []) tx.store.put(variant);
          await tx.done;
        }),
      );
    }

    localStorage.setItem('variantsTimestamp', Date.now().toString());
    localStorage.setItem('pokedexListsTimestamp', Date.now().toString());

    const result = await loadVariants();

    expect(fetchAndProcessVariants).not.toHaveBeenCalled();
    expect(result.listsBuiltNow).toBe(false);
    expect(result.variants.length).toBe(freshVariants.length);
  });

  it('stale lists only: rebuilds lists from cached variants without refetching variants', async () => {
    const variantsDB = await initVariantsDB();
    if (variantsDB) {
      const tx = variantsDB.transaction(VARIANTS_STORE, 'readwrite');
      for (const variant of freshVariants) tx.store.put(variant);
      await tx.done;
    }

    localStorage.setItem('variantsTimestamp', Date.now().toString());
    localStorage.setItem('pokedexListsTimestamp', staleTimestamp.toString());

    const result = await loadVariants();

    expect(fetchAndProcessVariants).not.toHaveBeenCalled();
    expect(result.listsBuiltNow).toBe(true);
    expect(Object.values(result.pokedexLists).flat().length).toBe(freshVariants.length);
    expect(Number(localStorage.getItem('pokedexListsTimestamp'))).toBeGreaterThan(staleTimestamp);
  });
});
