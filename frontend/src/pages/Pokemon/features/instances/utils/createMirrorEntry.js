// createMirrorEntry.js

import { generateUUID } from "@/utils/PokemonIDUtils";

export const createMirrorEntry = (pokemon, ownershipData, lists, updateDetails) => {
  const basePrefix = pokemon.pokemonKey.split('_').slice(0, -1).join('_');
  const newKey = `${basePrefix}_${generateUUID()}`;
  const newData = {
    ...pokemon.instanceData,
    is_wanted: true,
    is_owned: false,
    is_for_trade: false,
    is_unowned: false,
    mirror: true,
    pref_lucky: false,
    friendship_level: null,
    date_added: new Date().toISOString(),
  };

  ownershipData[newKey] = newData;
  lists.wanted[newKey] = newData;
  updateDetails(newKey, newData);

  updateDetails(pokemon.pokemonKey, {
    ...pokemon.instanceData,
    mirror: true
  });

  return newKey;
};
