// useSortManager.ts

import useRecentPokemons from './useRecentPokemons';
import useNumberPokemons from './useNumberPokemons';
import useHPPokemons from './useHPPokemons';
import useNamePokemons from './useNamePokemons';
import useCPPokemons from './useCPPokemons';
import useFavoritePokemons from './useFavoritePokemons';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { SortMode, SortType } from '@/types/sort';

const useSortManager = (
  displayedPokemons: PokemonVariant[],
  sortType: SortType,
  sortMode: SortMode
): PokemonVariant[] => {
  switch (sortType) {
    case 'releaseDate':
      return useRecentPokemons(displayedPokemons, sortMode);
    case 'number':
      return useNumberPokemons(displayedPokemons, sortMode);
    case 'hp':
      return useHPPokemons(displayedPokemons, sortMode);
    case 'name':
      return useNamePokemons(displayedPokemons, sortMode);
    case 'combatPower':
      return useCPPokemons(displayedPokemons, sortMode);
    case 'favorite':
      return useFavoritePokemons(displayedPokemons, sortMode);
    default:
      // Use type assertion since we've covered all cases
      return displayedPokemons as PokemonVariant[];
  }
};

export default useSortManager;