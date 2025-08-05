// src/features/variants/repositories/variantsRepository.ts
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { PokedexLists }   from '@/types/pokedex';

import { getAllVariants } from '@/db/variantsDB';
import { getAllPokedex }  from '@/db/pokedexDB';

import { loadVariants }   from '../utils/loadVariants';

export interface VariantsRepository {
  loadCache():  Promise<{ variants: PokemonVariant[]; pokedexLists: PokedexLists }>;
  fetchFresh(): Promise<{ variants: PokemonVariant[]; pokedexLists: PokedexLists }>;
}

export const variantsRepository: VariantsRepository = {
  async loadCache() {
    const [variants, pokedexLists] = await Promise.all([
      getAllVariants<PokemonVariant>(),
      getAllPokedex(),
    ]);
    return { variants, pokedexLists };
  },

  async fetchFresh() {
    const { variants, pokedexLists } = await loadVariants();
    return { variants, pokedexLists };
  },
};
