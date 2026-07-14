// src/features/variants/store/useVariantsStore.ts
import { create } from 'zustand';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { PokedexLists } from '@/types/pokedex';
import { variantsRepository } from '../repositories/variantsRepository';
import { createScopedLogger } from '@/utils/logger';

interface VariantsState {
  variants: PokemonVariant[];
  pokedexLists: PokedexLists;
  variantsLoading: boolean;
  isRefreshing: boolean;
  hydrateFromCache(): Promise<void>;
  refreshVariants(): Promise<void>;
}

const log = createScopedLogger('VariantsStore');

export const useVariantsStore = create<VariantsState>((set, get) => ({
  variants: [],
  pokedexLists: {} as PokedexLists,
  variantsLoading: true,
  isRefreshing: false,

  async hydrateFromCache() {
    try {
      const { variants, pokedexLists } = await variantsRepository.loadCache();
      if (variants.length) {
        set({ variants, pokedexLists, variantsLoading: false });
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
}));
