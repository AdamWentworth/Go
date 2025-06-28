// src/features/variants/store/useVariantsStore.ts
import { create } from 'zustand';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { PokedexLists } from '@/types/pokedex';
import { variantsRepository } from '../repositories/variantsRepository';
import {
  VARIANTS_KEY,
  POKEDEX_LISTS_KEY,
  isCacheFresh,
  setCacheTimestamp,
} from '../utils/cache';

interface VariantsState {
  variants: PokemonVariant[];
  pokedexLists: PokedexLists;
  variantsLoading: boolean;
  isRefreshing: boolean;
  hydrateFromCache(): Promise<void>;
  refreshVariants(): Promise<void>;
}

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

      // If either cache is stale, trigger a background refresh
      if (!isCacheFresh(VARIANTS_KEY) || !isCacheFresh(POKEDEX_LISTS_KEY)) {
        void get().refreshVariants();
      }
    } catch (error) {
      console.error('[VariantsStore] hydrateFromCache failed:', error);
      void get().refreshVariants();
    }
  },

  async refreshVariants() {
    if (get().isRefreshing) return;
    set({ isRefreshing: true });

    try {
      // Try serving fresh cache first
      if (isCacheFresh(VARIANTS_KEY) && isCacheFresh(POKEDEX_LISTS_KEY)) {
        const { variants, pokedexLists } = await variantsRepository.loadCache();
        if (variants.length) {
          set({ variants, pokedexLists, variantsLoading: false });
          return;
        }
      }

      // Otherwise fetch from network
      const { variants, pokedexLists } = await variantsRepository.fetchFresh();
      set({ variants, pokedexLists, variantsLoading: false });

      // Update cache timestamps
      setCacheTimestamp(VARIANTS_KEY);
      setCacheTimestamp(POKEDEX_LISTS_KEY);
    } catch (error) {
      console.error('[VariantsStore] refreshVariants failed:', error);

      // Fallback to whatever cache we have
      try {
        const { variants, pokedexLists } = await variantsRepository.loadCache();
        if (variants.length) {
          set({ variants, pokedexLists, variantsLoading: false });
        } else {
          set({ variantsLoading: false });
        }
      } catch (fallbackErr) {
        console.error('[VariantsStore] cache fallback failed:', fallbackErr);
        set({ variantsLoading: false });
      }
    } finally {
      set({ isRefreshing: false });
    }
  },
}));
