// useHPPokemons.ts

import { useMemo } from 'react';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { SortMode } from '@/types/sort'; // Updated import

const useHPPokemons = (
  displayedPokemons: PokemonVariant[],
  sortMode: SortMode
): PokemonVariant[] => {
  return useMemo(() => {
    return [...displayedPokemons].sort((a, b) => {
      // Direct stamina comparison without filtering
      return sortMode === 'ascending' 
        ? a.stamina - b.stamina 
        : b.stamina - a.stamina;
    });
  }, [displayedPokemons, sortMode]);
};

export default useHPPokemons;
