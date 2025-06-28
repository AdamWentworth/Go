// tests/unit/features/variants/useVariantsStore.unit.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useVariantsStore } from '@/features/variants/store/useVariantsStore';
import { loadVariants } from '@/features/variants/utils/loadVariants';
import {
  getAllFromDB,
  getAllPokedexListsFromDB,
  storePokedexListsInIndexedDB,
} from '@/db/indexedDB';
import { isDataFresh } from '@/utils/cacheHelpers';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { PokedexLists } from '@/types/pokedex';

// Import test fixtures
const variantsFixture = require('../../../../__helpers__/fixtures/variants.json') as PokemonVariant[];
const pokedexListsFixture = require('../../../../__helpers__/fixtures/pokedexLists.json') as PokedexLists;

// Take just the first few variants for testing to keep tests fast
const testVariants = variantsFixture.slice(0, 1);

// Create a minimal pokedexLists with empty arrays for all required lists
const testPokedexLists: PokedexLists = {
  default: [],
  shiny: [],
  costume: [],
  shadow: [],
  'shiny costume': [],
  'shiny shadow': [],
  'shadow costume': [],
  mega: [],
  'shiny mega': [],
  dynamax: [],
  'shiny dynamax': [],
  gigantamax: [],
  'shiny gigantamax': [],
  fusion: [],
  'shiny fusion': []
};

// Add just one variant to its appropriate list based on its variantType
testVariants.forEach(variant => {
  const listKey = variant.variantType.toLowerCase().replace('_', ' ');
  if (listKey in testPokedexLists) {
    testPokedexLists[listKey] = [variant];
  } else {
    testPokedexLists.default = [variant];
  }
});

// Mock all external dependencies
vi.mock('@/features/variants/utils/loadVariants');
vi.mock('@/db/indexedDB');
vi.mock('@/utils/cacheHelpers');

describe('useVariantsStore', () => {
  beforeEach(() => {
    // Set up fake timers
    vi.useFakeTimers();

    // Reset store state to initial values
    useVariantsStore.setState({
      variants: [],
      pokedexLists: {},
      variantsLoading: true,
      isRefreshing: false,
      hydrateFromCache: useVariantsStore.getState().hydrateFromCache,
      refreshVariants: useVariantsStore.getState().refreshVariants
    });

    // Reset all mocks
    vi.clearAllMocks();
    localStorage.clear();

    // Default mock implementations
    vi.mocked(loadVariants).mockResolvedValue({
      variants: testVariants,
      pokedexLists: testPokedexLists,
      listsBuiltNow: false
    });
    vi.mocked(getAllFromDB).mockResolvedValue([]);
    vi.mocked(getAllPokedexListsFromDB).mockResolvedValue({});
    vi.mocked(isDataFresh).mockReturnValue(false);
    vi.mocked(storePokedexListsInIndexedDB).mockResolvedValue(undefined);

    // Don't fail tests on expected console.error calls
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('hydrateFromCache', () => {
    it('should load data from cache and trigger refresh when cache hit', async () => {
      // Setup - Mock successful cache hit
      const cachedVariants = [...testVariants];
      const cachedLists = { ...testPokedexLists };
      vi.mocked(getAllFromDB).mockResolvedValueOnce(cachedVariants);
      vi.mocked(getAllPokedexListsFromDB).mockResolvedValueOnce(cachedLists);

      // Execute
      await useVariantsStore.getState().hydrateFromCache();

      // Verify immediate cache hydration
      expect(useVariantsStore.getState().variants).toEqual(cachedVariants);
      expect(useVariantsStore.getState().pokedexLists).toEqual(cachedLists);
      expect(useVariantsStore.getState().variantsLoading).toBe(false);

      // Verify refresh was triggered
      expect(loadVariants).toHaveBeenCalled();
    });

    it('should handle empty cache gracefully and trigger refresh', async () => {
      // Setup - Mock empty cache
      vi.mocked(getAllFromDB).mockResolvedValueOnce([]);
      vi.mocked(getAllPokedexListsFromDB).mockResolvedValueOnce({});
      vi.mocked(loadVariants).mockResolvedValueOnce({
        variants: testVariants,
        pokedexLists: testPokedexLists,
        listsBuiltNow: false
      });

      // Execute
      await useVariantsStore.getState().hydrateFromCache();

      // Verify state after refresh completes
      expect(useVariantsStore.getState().variants).toEqual(testVariants);
      expect(useVariantsStore.getState().pokedexLists).toEqual(testPokedexLists);
      expect(useVariantsStore.getState().variantsLoading).toBe(false);
      expect(loadVariants).toHaveBeenCalled();
    });

    it('should handle cache errors gracefully and trigger refresh', async () => {
      // Setup - Mock cache error
      vi.mocked(getAllFromDB).mockRejectedValueOnce(new Error('Cache error'));
      vi.mocked(loadVariants).mockResolvedValueOnce({
        variants: testVariants,
        pokedexLists: testPokedexLists,
        listsBuiltNow: false
      });

      // Execute
      await useVariantsStore.getState().hydrateFromCache();

      // Verify state after refresh completes
      expect(useVariantsStore.getState().variants).toEqual(testVariants);
      expect(useVariantsStore.getState().pokedexLists).toEqual(testPokedexLists);
      expect(useVariantsStore.getState().variantsLoading).toBe(false);
      expect(loadVariants).toHaveBeenCalled();
    });
  });

  describe('refreshVariants', () => {
    beforeEach(() => {
      // Reset store state before EACH test
      useVariantsStore.setState({
        variants: [],
        pokedexLists: {},
        variantsLoading: false,
        isRefreshing: false,
        hydrateFromCache: useVariantsStore.getState().hydrateFromCache,
        refreshVariants: useVariantsStore.getState().refreshVariants
      });

      // Clear storage
      localStorage.clear();
      
      // Reset all mocks to their default behavior
      vi.mocked(loadVariants).mockResolvedValue({
        variants: testVariants,
        pokedexLists: testPokedexLists,
        listsBuiltNow: false
      });
      vi.mocked(getAllFromDB).mockResolvedValue([]);
      vi.mocked(getAllPokedexListsFromDB).mockResolvedValue({});
      vi.mocked(isDataFresh).mockReturnValue(false);
      vi.mocked(storePokedexListsInIndexedDB).mockResolvedValue(undefined);
    });

    it('should fetch fresh data when cache is stale', async () => {
      // Setup - Mock stale cache
      const staleTimestamp = Date.now() - (1000 * 60 * 60 * 25); // 25 hours ago
      localStorage.setItem('variantsTimestamp', staleTimestamp.toString());
      vi.mocked(isDataFresh).mockReturnValue(false);
      vi.mocked(getAllFromDB).mockResolvedValue([]); // Ensure DB is empty
      
      // Execute refresh
      await useVariantsStore.getState().refreshVariants();
      
      // Verify loadVariants was called and state updated
      expect(loadVariants).toHaveBeenCalled();
      expect(useVariantsStore.getState().variants).toEqual(testVariants);
      expect(useVariantsStore.getState().isRefreshing).toBe(false);
    });

    it('should use cached data when cache is fresh', async () => {
      // Setup - Mock fresh cache
      const freshVariants = [...testVariants];
      vi.mocked(isDataFresh).mockReturnValue(true);
      vi.mocked(getAllFromDB).mockResolvedValueOnce(freshVariants);
      localStorage.setItem('variantsTimestamp', Date.now().toString());
      localStorage.setItem('pokedexListsTimestamp', Date.now().toString());

      // Execute
      await useVariantsStore.getState().refreshVariants();

      // Verify cache was used
      expect(useVariantsStore.getState().variants).toEqual(freshVariants);
      expect(useVariantsStore.getState().variantsLoading).toBe(false);
      // Note: loadVariants is called in hydrateFromCache, so we don't check it here
    });

    it('should prevent concurrent refreshes', async () => {
      // Setup
      useVariantsStore.setState({ isRefreshing: true });
      
      // Execute
      await useVariantsStore.getState().refreshVariants();

      // Verify no new refresh occurred
      expect(useVariantsStore.getState().isRefreshing).toBe(true);
    });

    it('should handle refresh errors gracefully', async () => {
      // Setup - Mock API error
      vi.mocked(loadVariants).mockRejectedValueOnce(new Error('API error'));
      vi.mocked(isDataFresh).mockReturnValue(false); // Force fresh data path
      vi.mocked(getAllFromDB).mockResolvedValue([]); // Empty DB to force loadVariants
      
      // Set initial state with some variants
      useVariantsStore.setState({ 
        variants: testVariants,
        variantsLoading: false,
        isRefreshing: false
      });

      // Execute
      await useVariantsStore.getState().refreshVariants();

      // Verify error handling - should maintain last known good state
      const finalState = useVariantsStore.getState();
      expect(finalState.variants).toEqual(testVariants); // Keep last known good state
      expect(finalState.variantsLoading).toBe(false); // Loading should be false after error
      expect(finalState.isRefreshing).toBe(false); // Refresh flag is reset
      expect(loadVariants).toHaveBeenCalled();
    });

    it('should handle lists built during variant load', async () => {
      // Setup - Mock lists built during load
      const newVariants = [...testVariants];
      const newLists = { ...testPokedexLists };
      vi.mocked(loadVariants).mockResolvedValueOnce({
        variants: newVariants,
        pokedexLists: newLists,
        listsBuiltNow: true
      });

      // Set initial state to ensure we're testing the change
      useVariantsStore.setState({
        variants: [],
        pokedexLists: {},
        variantsLoading: false,
        isRefreshing: false
      });

      // Execute
      await useVariantsStore.getState().refreshVariants();

      // Verify state updates in order
      const finalState = useVariantsStore.getState();
      expect(finalState.variants).toEqual(newVariants);
      expect(finalState.pokedexLists).toEqual(newLists);
      expect(finalState.variantsLoading).toBe(false);
      expect(finalState.isRefreshing).toBe(false);
    });
  });
});
