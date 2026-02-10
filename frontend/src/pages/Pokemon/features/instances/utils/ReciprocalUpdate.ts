type BooleanMap = Record<string, boolean>;

interface InstanceListsShape {
  not_trade_list?: BooleanMap;
  not_wanted_list?: BooleanMap;
}

type InstanceMap = Record<string, InstanceListsShape | undefined>;

/**
 * Return a new `not_trade_list` for `otherPokemonKey` without mutating store data.
 */
export const updateNotTradeList = (
  instances: InstanceMap,
  currentPokemonKey: string,
  otherPokemonKey: string,
  add: boolean,
): BooleanMap | null => {
  const otherInst = instances[otherPokemonKey];
  if (!otherInst) return null;

  const next: BooleanMap = { ...(otherInst.not_trade_list || {}) };
  if (add) next[currentPokemonKey] = true;
  else delete next[currentPokemonKey];
  return next;
};

/**
 * Symmetric helper for the Wanted side.
 */
export const updateNotWantedList = (
  instances: InstanceMap,
  currentPokemonKey: string,
  otherPokemonKey: string,
  add: boolean,
): BooleanMap | null => {
  const otherInst = instances[otherPokemonKey];
  if (!otherInst) return null;

  const next: BooleanMap = { ...(otherInst.not_wanted_list || {}) };
  if (add) next[currentPokemonKey] = true;
  else delete next[currentPokemonKey];
  return next;
};

