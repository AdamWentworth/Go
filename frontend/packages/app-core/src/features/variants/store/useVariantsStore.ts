// src/features/variants/store/useVariantsStore.ts
import { create } from 'zustand';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { PokedexLists } from '@/types/pokedex';
import { variantsRepository } from '../repositories/variantsRepository';
import { createScopedLogger } from '@/utils/logger';
import {
  getPokemonCatalogManifest,
  getPokemonMovesChunk,
  getPokemonRaidDataChunk,
} from '@/services/pokemonDataService';
import { queueVariantsPersist } from '@/db/variantsDB';
import { getStorageString, setStorageString, STORAGE_KEYS } from '@/utils/storage';
import {
  mergePokemonMovesChunk,
  mergePokemonRaidDataChunk,
} from '../utils/mergePokemonDataChunks';
import {
  hasHydratedMoves,
  hasHydratedRaidData,
  prepareVariantChunkHydration,
} from '../utils/prepareVariantChunkHydration';

interface VariantsState {
  variants: PokemonVariant[];
  pokedexLists: PokedexLists;
  variantsLoading: boolean;
  isRefreshing: boolean;
  isMovesLoading: boolean;
  isRaidDataLoading: boolean;
  movesHydrationPending: boolean;
  raidDataHydrationPending: boolean;
  raidDataRequested: boolean;
  hydrateFromCache(): Promise<void>;
  refreshVariants(): Promise<void>;
  ensureMoves(): Promise<void>;
  ensureRaidData(): Promise<void>;
}

const log = createScopedLogger('VariantsStore');

export const useVariantsStore = create<VariantsState>((set, get) => ({
  variants: [],
  pokedexLists: {} as PokedexLists,
  variantsLoading: true,
  isRefreshing: false,
  isMovesLoading: false,
  isRaidDataLoading: false,
  movesHydrationPending: false,
  raidDataHydrationPending: false,
  raidDataRequested: false,

  async hydrateFromCache() {
    try {
      const { variants, pokedexLists } = await variantsRepository.loadCache();
      if (variants.length) {
        set({ variants, pokedexLists, variantsLoading: false });
        // Move pools power detail and instance controls, but they should not
        // delay catalog cards from becoming usable.
        void get().ensureMoves();
      }

      // Always let the manifest-aware refresh path verify the cached catalog version.
      // If the server version matches, this only costs the small manifest request.
      if (variants.length) {
        void get().refreshVariants();
      } else {
        await get().refreshVariants();
      }
    } catch (error) {
      log.error('hydrateFromCache failed', error);
      void get().refreshVariants();
    }
  },

  async refreshVariants() {
    if (get().isRefreshing) return;
    set({ isRefreshing: true });

    try {
      // The repository refresh path checks the lightweight catalog manifest first.
      // Matching versions return IndexedDB data; changed versions fetch the data chunk.
      const { variants, pokedexLists } = await variantsRepository.fetchFresh();
      set({ variants, pokedexLists, variantsLoading: false });
      if (variants.length) {
        void get().ensureMoves();
        if (get().raidDataRequested) {
          void get().ensureRaidData();
        }
      }
    } catch (error) {
      log.error('refreshVariants failed', error);

      // Fallback to whatever cache we have
      try {
        const { variants, pokedexLists } = await variantsRepository.loadCache();
        if (variants.length) {
          set({ variants, pokedexLists, variantsLoading: false });
        } else {
          set({ variantsLoading: false });
        }
      } catch (fallbackErr) {
        log.error('cache fallback failed', fallbackErr);
        set({ variantsLoading: false });
      }
    } finally {
      set({ isRefreshing: false });
    }
  },

  async ensureMoves() {
    if (get().variants.length === 0) return;
    if (get().isMovesLoading) {
      set({ movesHydrationPending: true });
      return;
    }
    set({ isMovesLoading: true, movesHydrationPending: false });

    try {
      const manifest = await getPokemonCatalogManifest();
      const update = await prepareVariantChunkHydration({
        manifest,
        chunkName: 'moves',
        storedVersion: getStorageString(STORAGE_KEYS.pokemonMovesVersion),
        getVariants: () => get().variants,
        hasHydratedData: hasHydratedMoves,
        fetchChunk: getPokemonMovesChunk,
      });
      if (!update) return;

      // Merge and commit synchronously against the latest snapshot so another
      // lazy chunk cannot overwrite data that finished hydrating first.
      const variants = mergePokemonMovesChunk(get().variants, update.chunk);
      set({ variants });
      queueVariantsPersist(variants, Date.now(), undefined, update.catalogVersion);
      setStorageString(STORAGE_KEYS.pokemonMovesVersion, update.chunkVersion);
    } catch (error) {
      log.warn('ensureMoves failed; retaining the current catalog cache', error);
    } finally {
      const retry = get().movesHydrationPending;
      set({ isMovesLoading: false, movesHydrationPending: false });
      if (retry) {
        void get().ensureMoves();
      }
    }
  },

  async ensureRaidData() {
    set({ raidDataRequested: true });
    if (get().variants.length === 0) return;
    if (get().isRaidDataLoading) {
      set({ raidDataHydrationPending: true });
      return;
    }
    set({ isRaidDataLoading: true, raidDataHydrationPending: false });

    try {
      const manifest = await getPokemonCatalogManifest();
      const update = await prepareVariantChunkHydration({
        manifest,
        chunkName: 'raidData',
        storedVersion: getStorageString(STORAGE_KEYS.pokemonRaidDataVersion),
        getVariants: () => get().variants,
        hasHydratedData: hasHydratedRaidData,
        fetchChunk: getPokemonRaidDataChunk,
      });
      if (!update) return;

      const variants = mergePokemonRaidDataChunk(get().variants, update.chunk);
      set({ variants });
      queueVariantsPersist(variants, Date.now(), undefined, update.catalogVersion);
      setStorageString(STORAGE_KEYS.pokemonRaidDataVersion, update.chunkVersion);
    } catch (error) {
      log.warn('ensureRaidData failed; retaining the current catalog cache', error);
    } finally {
      const retry = get().raidDataHydrationPending;
      set({ isRaidDataLoading: false, raidDataHydrationPending: false });
      if (retry) {
        void get().ensureRaidData();
      }
    }
  },
}));
