// tests/integration/features/variants/store/useVariantsStore.integration.test.ts
import {
  vi,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  type MockInstance,
} from 'vitest';

import { useVariantsStore } from '@/features/variants/store/useVariantsStore';
import { variantsRepository } from '@/features/variants/repositories/variantsRepository';
import { CACHE_TTL_MS } from '@/features/variants/utils/cache';

import type { PokemonVariant } from '@/types/pokemonVariants';
import type { PokedexLists } from '@/types/pokedex';

import variantsFixture from '@/../tests/__helpers__/fixtures/variants.json';
import pokedexListsFixture from '@/../tests/__helpers__/fixtures/pokedexLists.json';

const dummyVariants = variantsFixture as PokemonVariant[];
const dummyPokedexLists = pokedexListsFixture as PokedexLists;

let loadCacheSpy: MockInstance;

describe('useVariantsStore integration', () => {
  beforeEach(() => {
    localStorage.clear();

    const now = Date.now();
    localStorage.setItem('variantsTimestamp', now.toString());
    localStorage.setItem('pokedexListsTimestamp', now.toString());

    loadCacheSpy = vi
      .spyOn(variantsRepository, 'loadCache')
      .mockResolvedValue({
        variants: dummyVariants,
        pokedexLists: dummyPokedexLists,
      });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    useVariantsStore.setState({
      variants: [],
      pokedexLists: {} as PokedexLists,
      variantsLoading: true,
      isRefreshing: false,
    });
  });

  it('hydrates from cache correctly', async () => {
    await useVariantsStore.getState().hydrateFromCache();
    expect(useVariantsStore.getState().variantsLoading).toBe(false);
    expect(useVariantsStore.getState().variants).toEqual(dummyVariants);
  });

  it('fetches fresh variants when cache is stale', async () => {
    const stale = Date.now() - CACHE_TTL_MS - 1_000;
    localStorage.setItem('variantsTimestamp', stale.toString());
    localStorage.setItem('pokedexListsTimestamp', stale.toString());

    const fetchFreshSpy = vi
      .spyOn(variantsRepository, 'fetchFresh')
      .mockResolvedValue({ variants: dummyVariants, pokedexLists: dummyPokedexLists });

    await useVariantsStore.getState().refreshVariants();

    expect(fetchFreshSpy).toHaveBeenCalled();
    expect(useVariantsStore.getState().variants).toEqual(dummyVariants);
  });

  it('triggers background refresh during hydrate when only one cache is stale', async () => {
    const stale = Date.now() - CACHE_TTL_MS - 1_000;
    localStorage.setItem('variantsTimestamp', stale.toString());
    localStorage.setItem('pokedexListsTimestamp', Date.now().toString());

    const refreshSpy = vi
      .spyOn(useVariantsStore.getState(), 'refreshVariants')
      .mockResolvedValue();

    await useVariantsStore.getState().hydrateFromCache();
    await Promise.resolve();

    expect(refreshSpy.mock.calls.length).toBeGreaterThanOrEqual(1);
    expect(useVariantsStore.getState().variants).toEqual(dummyVariants);
  });

  it('returns early for fresh cache and never calls fetchFresh', async () => {
    const fetchFreshSpy = vi
      .spyOn(variantsRepository, 'fetchFresh')
      .mockResolvedValue({ variants: [], pokedexLists: {} as PokedexLists });

    await useVariantsStore.getState().refreshVariants();

    expect(fetchFreshSpy).not.toHaveBeenCalled();
    expect(useVariantsStore.getState().variants).toEqual(dummyVariants);
  });

  it('falls back to cached variants when fetchFresh throws', async () => {
    const stale = Date.now() - CACHE_TTL_MS - 1_000;
    localStorage.setItem('variantsTimestamp', stale.toString());
    localStorage.setItem('pokedexListsTimestamp', stale.toString());

    vi.spyOn(variantsRepository, 'fetchFresh').mockRejectedValue(new Error('network down'));

    await useVariantsStore.getState().refreshVariants();

    expect(loadCacheSpy.mock.calls.length).toBeGreaterThanOrEqual(2); // initial read + fallback
    expect(useVariantsStore.getState().variants).toEqual(dummyVariants);
  });

  it('ignores a second refresh call while one is already running', async () => {
    // Stale timestamps so refreshVariants will attempt the network
    const stale = Date.now() - CACHE_TTL_MS - 1_000;
    localStorage.setItem('variantsTimestamp', stale.toString());
    localStorage.setItem('pokedexListsTimestamp', stale.toString());

    // Create a deferred promise to keep the first fetch busy
    let resolveFetch!: (v: { variants: PokemonVariant[]; pokedexLists: PokedexLists }) => void;
    const fetchPromise = new Promise<{ variants: PokemonVariant[]; pokedexLists: PokedexLists }>(
      (r) => (resolveFetch = r),
    );
    const fetchFreshSpy = vi
      .spyOn(variantsRepository, 'fetchFresh')
      .mockReturnValue(fetchPromise as unknown as Promise<any>);

    // Kick off two refreshes without awaiting the first
    const store = useVariantsStore.getState();
    const first = store.refreshVariants();
    const second = store.refreshVariants(); // should return immediately

    // Let the call stack clear so isRefreshing has time to flip
    await Promise.resolve();

    // Complete the network request
    resolveFetch({ variants: dummyVariants, pokedexLists: dummyPokedexLists });
    await Promise.all([first, second]);

    // Only one network call should have been made
    expect(fetchFreshSpy).toHaveBeenCalledTimes(1);
    expect(useVariantsStore.getState().variants).toEqual(dummyVariants);
  });
});
