// useNamePokemons.ts

import { useMemo } from 'react';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { SortMode } from '@/types/sort'; // Updated import

const useNamePokemons = (
  displayedPokemons: PokemonVariant[],
  sortMode: SortMode
): PokemonVariant[] => {
  return useMemo(() => {
    const getBaseName = (value: unknown): string => {
      if (typeof value !== 'string') {
        return '';
      }

      const trimmed = value.trim();
      if (!trimmed) {
        return '';
      }

      const lastSpaceIdx = trimmed.lastIndexOf(' ');
      return lastSpaceIdx >= 0 ? trimmed.substring(lastSpaceIdx + 1) : trimmed;
    };

    const getSortName = (pokemon: PokemonVariant): string =>
      getBaseName(pokemon.species_name ?? pokemon.name ?? '');

    return [...displayedPokemons].sort((a, b) => {
      const baseNameA = getSortName(a);
      const baseNameB = getSortName(b);

      // Sort alphabetically by base name
      return sortMode === 'ascending' 
        ? baseNameA.localeCompare(baseNameB) 
        : baseNameB.localeCompare(baseNameA);
    });
  }, [displayedPokemons, sortMode]);
};

export default useNamePokemons;
