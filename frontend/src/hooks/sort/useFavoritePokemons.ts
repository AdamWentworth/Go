// useFavoritePokemons.ts
import { useMemo } from 'react';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { SortMode } from '@/types/sort'; // Updated import

const useFavoritePokemons = (
  displayedPokemons: PokemonVariant[],
  sortMode: SortMode
): PokemonVariant[] => {
  return useMemo(() => {
    // Split into favorite and non-favorite groups
    const [favorites, nonFavorites] = displayedPokemons.reduce(
      (acc, variant) => {
        acc[variant.instanceData?.favorite ? 0 : 1].push(variant);
        return acc;
      },
      [[], []] as [PokemonVariant[], PokemonVariant[]]
    );

    // Sort function for CP comparison
    const sortByCP = (a: PokemonVariant, b: PokemonVariant) => {
      const resolveCP = (variant: PokemonVariant) => {
        // 1. Check if instanceData exists at all
        if (variant.instanceData) {
          // 2. Use instance CP even if it's null/undefined
          return variant.instanceData.cp ?? null;
        }
        // 3. Only fallback to species CP50 if NO instanceData
        return variant.cp50 ?? 0;
      };
    
      // Convert values to numbers safely
      const parseCP = (cp: number | null | undefined) => {
        const numeric = Number(cp);
        return isNaN(numeric) ? -1 : numeric;
      };
    
      const cpA = parseCP(resolveCP(a));
      const cpB = parseCP(resolveCP(b));
    
      if (cpA === cpB) {
        return a.pokedex_number - b.pokedex_number;
      }
      return sortMode === 'ascending' ? cpA - cpB : cpB - cpA;
    };

    // Sort each group separately
    const sortedFavorites = [...favorites].sort(sortByCP);
    const sortedNonFavorites = [...nonFavorites].sort(sortByCP);

    return [...sortedFavorites, ...sortedNonFavorites];
  }, [displayedPokemons, sortMode]);
};

export default useFavoritePokemons;