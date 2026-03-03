type TradePokemonDetails = {
  fast_move_id?: number | string | null;
  charged_move1_id?: number | string | null;
  charged_move2_id?: number | string | null;
  attack_iv?: unknown;
  defense_iv?: unknown;
  stamina_iv?: unknown;
  weight?: unknown;
  height?: unknown;
  location_caught?: unknown;
  date_caught?: unknown;
};

export const hasDetails = (pokemon: TradePokemonDetails | null | undefined): boolean => {
  if (!pokemon) return false;

  const hasMoves = Boolean(
    pokemon.fast_move_id ||
      pokemon.charged_move1_id ||
      pokemon.charged_move2_id,
  );

  const hasIVs =
    typeof pokemon.attack_iv === 'number' ||
    typeof pokemon.defense_iv === 'number' ||
    typeof pokemon.stamina_iv === 'number';

  const hasWeightOrHeight =
    (typeof pokemon.weight === 'number' && pokemon.weight > 0) ||
    (typeof pokemon.height === 'number' && pokemon.height > 0);

  return Boolean(
    hasMoves ||
      hasIVs ||
      hasWeightOrHeight ||
      pokemon.location_caught ||
      pokemon.date_caught,
  );
};
