/* ReciprocalUpdate.js
   ------------------------------------------------------------------ */
/**
 * Return a **new** `not_trade_list` for `otherPokemonKey` without
 * mutating the frozen instance object held in zustand/Immer.
 */
export const updateNotTradeList = (
  instances,          // live map from the store
  currentPokemonKey,  // instance we’re editing (the “parent”)
  otherPokemonKey,    // partner whose list we patch
  add,                // true = link, false = unlink
) => {
  const otherInst = instances[otherPokemonKey];
  if (!otherInst) {
    console.error(`No data found for ${otherPokemonKey}`);
    return null;
  }

  /* clone -> modify -> return --------------------------------------- */
  const next = { ...(otherInst.not_trade_list || {}) };
  if (add) {
    next[currentPokemonKey] = true;
  } else {
    delete next[currentPokemonKey];
  }
  return next;        // caller puts this into patchMap
};

/**
 * Symmetric helper for the Wanted side.
 */
export const updateNotWantedList = (
  instances,
  currentPokemonKey,
  otherPokemonKey,
  add,
) => {
  const otherInst = instances[otherPokemonKey];
  if (!otherInst) {
    console.error(`No data found for ${otherPokemonKey}`);
    return null;
  }

  const next = { ...(otherInst.not_wanted_list || {}) };
  if (add) {
    next[currentPokemonKey] = true;
  } else {
    delete next[currentPokemonKey];
  }
  return next;
};
