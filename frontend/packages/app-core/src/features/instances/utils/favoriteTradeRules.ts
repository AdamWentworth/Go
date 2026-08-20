import type { PokemonInstance } from '@/types/pokemonInstance';

type InstancePatch = Partial<PokemonInstance>;

export const FAVORITE_TO_TRADE_ERROR =
  'Favorite Pokémon cannot be listed For Trade. Remove Favorite first.';

export const TRADE_TO_FAVORITE_ERROR =
  'For Trade Pokémon cannot be marked as Favorite. Remove it from For Trade first.';

export const getFavoriteTradeConflict = (
  current: InstancePatch,
  patch: InstancePatch,
): string | null => {
  if (patch.favorite === undefined && patch.is_for_trade === undefined) return null;
  const nextFavorite = patch.favorite ?? current.favorite ?? false;
  const nextForTrade = patch.is_for_trade ?? current.is_for_trade ?? false;
  if (!nextFavorite || !nextForTrade) return null;

  if (patch.favorite === true && current.is_for_trade && patch.is_for_trade !== false) {
    return TRADE_TO_FAVORITE_ERROR;
  }
  return FAVORITE_TO_TRADE_ERROR;
};

export const enforceFavoriteTradeInvariant = (
  instance: InstancePatch,
  preferredState: 'favorite' | 'trade',
) => {
  if (!instance.favorite || !instance.is_for_trade) return;
  if (preferredState === 'trade') instance.favorite = false;
  else instance.is_for_trade = false;
};
