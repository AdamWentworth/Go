// useCPPokemons.ts
import { useMemo } from 'react';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { SortMode } from '@/types/sort'; // Updated import

const useCPPokemons = (
  displayedPokemons: PokemonVariant[],
  sortMode: SortMode
): PokemonVariant[] => {
  return useMemo(() => {
    return [...displayedPokemons].sort((a, b) => {
      // CP resolution logic from useFavoritePokemons
      const resolveCP = (variant: PokemonVariant) => {
        if (variant.instanceData) {
          return variant.instanceData.cp ?? null;
        }
        return variant.cp50 ?? 0;
      };

      const parseCP = (cp: number | null | undefined) => {
        const numeric = Number(cp);
        return isNaN(numeric) ? -1 : numeric;
      };

      const cpA = parseCP(resolveCP(a));
      const cpB = parseCP(resolveCP(b));

      // Secondary sort by Pokedex number if CP matches
      if (cpA === cpB) {
        return a.pokedex_number - b.pokedex_number;
      }

      // Primary CP sort based on sort mode
      return sortMode === 'ascending' ? cpA - cpB : cpB - cpA;
    });
  }, [displayedPokemons, sortMode]);
};

export default useCPPokemons;