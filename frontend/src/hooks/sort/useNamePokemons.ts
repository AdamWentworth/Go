// useNamePokemons.ts

import { useMemo } from 'react';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { SortMode } from '@/types/sort'; // Updated import

const useNamePokemons = (
  displayedPokemons: PokemonVariant[],
  sortMode: SortMode
): PokemonVariant[] => {
  return useMemo(() => {
    return [...displayedPokemons].sort((a, b) => {
      // Function to extract the base name by slicing off everything before the last space
      const getBaseName = (name: string) => {
        return name.substring(name.lastIndexOf(' ') + 1);
      };

      const baseNameA = getBaseName(a.species_name);
      const baseNameB = getBaseName(b.species_name);

      // Sort alphabetically by base name
      return sortMode === 'ascending' 
        ? baseNameA.localeCompare(baseNameB) 
        : baseNameB.localeCompare(baseNameA);
    });
  }, [displayedPokemons, sortMode]);
};

export default useNamePokemons;