import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { useVariantsStore } from '@/features/variants/store/useVariantsStore';
import { variantsRepository } from '@/features/variants/repositories/variantsRepository';
import {
  isCacheFresh,
  VARIANTS_KEY,
  POKEDEX_LISTS_KEY,
} from '@/features/variants/utils/cache';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { PokedexLists } from '@/types/pokedex';

import variantsFixture from '@/../tests/__helpers__/fixtures/variants.json';
import pokedexListsFixture from '@/../tests/__helpers__/fixtures/pokedexLists.json';

vi.mock('@/features/variants/repositories/variantsRepository', () => ({
  variantsRepository: {
    loadCache: vi.fn(),
    fetchFresh: vi.fn(),
  },
}));

vi.mock('@/features/variants/utils/cache', async () => {
  const actual = await vi.importActual<typeof import('@/features/variants/utils/cache')>(
    '@/features/variants/utils/cache',
  );
  return {
    ...actual,
    isCacheFresh: vi.fn(),
  };
});

const cachedVariants = (variantsFixture as unknown as PokemonVariant[]).slice(0, 3);
const freshVariants = (variantsFixture as unknown as PokemonVariant[]).slice(3, 8);
const cachedLists = pokedexListsFixture as unknown as PokedexLists;
const freshLists = {
  ...(pokedexListsFixture as unknown as PokedexLists),
  default: freshVariants,
} as PokedexLists;

describe.sequential('useVariantsStore (unit)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    useVariantsStore.setState({
      variants: [],
      pokedexLists: {} as PokedexLists,
      variantsLoading: true,
      isRefreshing: false,
    });

    vi.mocked(variantsRepository.loadCache).mockResolvedValue({
      variants: cachedVariants,
      pokedexLists: cachedLists,
    });

    vi.mocked(variantsRepository.fetchFresh).mockResolvedValue({
      variants: freshVariants,
      pokedexLists: freshLists,
    });

    vi.mocked(isCacheFresh).mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('hydrates from cache when cache exists and is fresh', async () => {
    await useVariantsStore.getState().hydrateFromCache();

    const state = useVariantsStore.getState();
    expect(state.variants).toEqual(cachedVariants);
    expect(state.pokedexLists).toEqual(cachedLists);
    expect(state.variantsLoading).toBe(false);
    expect(variantsRepository.fetchFresh).not.toHaveBeenCalled();
  });

  it('hydrates from cache and triggers background refresh when stale', async () => {
    vi.mocked(isCacheFresh).mockImplementation((key: string) => key === POKEDEX_LISTS_KEY);

    await useVariantsStore.getState().hydrateFromCache();
    // background refresh is fire-and-forget
    await vi.waitFor(() => {
      expect(variantsRepository.fetchFresh).toHaveBeenCalled();
    });

    expect(useVariantsStore.getState().variants).toEqual(freshVariants);
  });

  it('refreshVariants uses cache-only path when both caches are fresh', async () => {
    vi.mocked(isCacheFresh).mockReturnValue(true);

    await useVariantsStore.getState().refreshVariants();

    const state = useVariantsStore.getState();
    expect(variantsRepository.loadCache).toHaveBeenCalled();
    expect(variantsRepository.fetchFresh).not.toHaveBeenCalled();
    expect(state.variants).toEqual(cachedVariants);
    expect(state.variantsLoading).toBe(false);
    expect(state.isRefreshing).toBe(false);
  });

  it('refreshVariants fetches fresh data and updates cache timestamps when stale', async () => {
    vi.mocked(isCacheFresh).mockReturnValue(false);

    await useVariantsStore.getState().refreshVariants();

    const state = useVariantsStore.getState();
    expect(variantsRepository.fetchFresh).toHaveBeenCalled();
    expect(state.variants).toEqual(freshVariants);
    expect(state.pokedexLists).toEqual(freshLists);
    expect(state.isRefreshing).toBe(false);
  });

  it('refreshVariants falls back to cache on fetch failure', async () => {
    vi.mocked(isCacheFresh).mockReturnValue(false);
    vi.mocked(variantsRepository.fetchFresh).mockRejectedValueOnce(new Error('network down'));
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await useVariantsStore.getState().refreshVariants();

    const state = useVariantsStore.getState();
    expect(variantsRepository.fetchFresh).toHaveBeenCalled();
    expect(variantsRepository.loadCache).toHaveBeenCalled();
    expect(state.variants).toEqual(cachedVariants);
    expect(state.variantsLoading).toBe(false);
    expect(state.isRefreshing).toBe(false);
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it('refreshVariants is a no-op while another refresh is running', async () => {
    useVariantsStore.setState({ isRefreshing: true });

    await useVariantsStore.getState().refreshVariants();

    expect(variantsRepository.fetchFresh).not.toHaveBeenCalled();
    expect(variantsRepository.loadCache).not.toHaveBeenCalled();
    expect(useVariantsStore.getState().isRefreshing).toBe(true);
  });
});
