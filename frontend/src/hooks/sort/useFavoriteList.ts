import { useMemo } from 'react';

type FavoriteListItem = {
  favorite?: boolean;
  cp?: number | string | null;
  cp50?: number | string | null;
  pokedex_number?: number | string | null;
};

const toIntegerOrFallback = (
  value: number | string | null | undefined,
  fallback: number,
): number => {
  if (value == null) return fallback;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const useFavoriteList = <T extends FavoriteListItem>(
  displayedPokemons: T[] | undefined | null,
): T[] =>
  useMemo(() => {
    if (!Array.isArray(displayedPokemons)) return [];

    return [...displayedPokemons].sort((a, b) => {
      const favA = !!a?.favorite;
      const favB = !!b?.favorite;

      // Prioritize favorites.
      if (favA && !favB) return -1;
      if (!favA && favB) return 1;

      // Sort by CP descending; fallback to cp50; missing/invalid values go last.
      const cpA =
        a?.cp != null
          ? toIntegerOrFallback(a.cp, -1)
          : toIntegerOrFallback(a?.cp50, -1);
      const cpB =
        b?.cp != null
          ? toIntegerOrFallback(b.cp, -1)
          : toIntegerOrFallback(b?.cp50, -1);
      if (cpA !== cpB) return cpB - cpA;

      // Stable final tie-breaker for deterministic ordering.
      return toIntegerOrFallback(a?.pokedex_number, 0) - toIntegerOrFallback(b?.pokedex_number, 0);
    });
  }, [displayedPokemons]);

export default useFavoriteList;
