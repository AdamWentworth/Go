// useFavoriteList.js
import { useMemo } from 'react';

const useFavoriteList = (displayedPokemons) => {
  return useMemo(() => {
    if (!Array.isArray(displayedPokemons)) return [];

    const sortedPokemons = [...displayedPokemons].sort((a, b) => {
      const favA = a?.favorite || false;
      const favB = b?.favorite || false;

      // Prioritize favorites
      if (favA && !favB) return -1;
      if (!favA && favB) return 1;

      // Extract CP values, defaulting to -1 if not available
      const cpA = a?.cp ? parseInt(a.cp, 10) : a?.cp50 ? parseInt(a.cp50, 10) : -1;
      const cpB = b?.cp ? parseInt(b.cp, 10) : b?.cp50 ? parseInt(b.cp50, 10) : -1;

      // Handle NaN cases
      const validCpA = !isNaN(cpA) ? cpA : -1;
      const validCpB = !isNaN(cpB) ? cpB : -1;

      // Sort by CP in descending order
      if (validCpA !== validCpB) {
        return validCpB - validCpA;
      }

      // If CP values are equal, sort by Pokédex number
      return (a.pokedex_number || 0) - (b.pokedex_number || 0);
    });

    return sortedPokemons;
  }, [displayedPokemons]);
};

export default useFavoriteList;
