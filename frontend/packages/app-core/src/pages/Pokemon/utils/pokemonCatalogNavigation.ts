export type PokemonCatalogFilter =
  | "Caught"
  | "Trade"
  | "Wanted"
  | "Favorites";

const catalogFilterByQueryValue: Record<string, PokemonCatalogFilter> = {
  caught: "Caught",
  trade: "Trade",
  wanted: "Wanted",
  favorites: "Favorites",
};

export const readPokemonCatalogFilter = (
  search: string,
): PokemonCatalogFilter | null => {
  const value = new URLSearchParams(search).get("filter");
  if (!value) return null;
  return catalogFilterByQueryValue[value.trim().toLowerCase()] ?? null;
};

export const buildPokemonCatalogPath = ({
  username,
  filter,
}: {
  username?: string;
  filter: PokemonCatalogFilter;
}): string => {
  const pathname = username
    ? `/pokemon/${encodeURIComponent(username)}`
    : "/pokemon";
  const query = new URLSearchParams({
    filter: filter.toLowerCase(),
  });

  return `${pathname}?${query.toString()}`;
};
