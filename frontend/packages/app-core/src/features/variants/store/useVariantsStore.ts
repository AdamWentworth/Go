// src/features/variants/store/useVariantsStore.ts
import { create } from 'zustand';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { PokedexLists } from '@/types/pokedex';
import { variantsRepository } from '../repositories/variantsRepository';
import { createScopedLogger } from '@/utils/logger';
import {
  getCatalogDataVersion,
  getChunkVersion,
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

const hasHydratedMoves = (variants: PokemonVariant[]): boolean =>
  variants.some(
    (variant) =>
      (variant.moves?.length ?? 0) > 0 ||
      variant.fusion?.some((fusion) => (fusion.moves?.length ?? 0) > 0) ||
      variant.crownForms?.some((crown) => (crown.moves?.length ?? 0) > 0),
  );

const hasHydratedRaidData = (variants: PokemonVariant[]): boolean =>
  variants.some((variant) => (variant.raid_boss?.length ?? 0) > 0);

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
      const version = getChunkVersion(manifest, 'moves');
      const versionMatches = getStorageString(STORAGE_KEYS.pokemonMovesVersion) === version;
      if (!version || (versionMatches && hasHydratedMoves(get().variants))) return;

      const movesChunk = await getPokemonMovesChunk(manifest);
      if (!movesChunk) return;

      const variants = mergePokemonMovesChunk(get().variants, movesChunk);
      set({ variants });
      queueVariantsPersist(variants, Date.now(), undefined, getCatalogDataVersion(manifest) ?? undefined);
      setStorageString(STORAGE_KEYS.pokemonMovesVersion, version);
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
      const version = getChunkVersion(manifest, 'raidData');
      const versionMatches = getStorageString(STORAGE_KEYS.pokemonRaidDataVersion) === version;
      if (!version || (versionMatches && hasHydratedRaidData(get().variants))) return;

      const raidDataChunk = await getPokemonRaidDataChunk(manifest);
      if (!raidDataChunk) return;

      const variants = mergePokemonRaidDataChunk(get().variants, raidDataChunk);
      set({ variants });
      queueVariantsPersist(variants, Date.now(), undefined, getCatalogDataVersion(manifest) ?? undefined);
      setStorageString(STORAGE_KEYS.pokemonRaidDataVersion, version);
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
