// ReciprocalUpdate.ts

import type { InstancesData } from '@/types/instances';
import type { PokemonInstance } from '@/types/pokemonInstance';

/**
 * Adds or removes a key from another Pokémon’s not_trade_list.
 *
 * @param instances All Pokémon instances, keyed by instance ID.
 * @param currentPokemonKey The key of the current Pokémon.
 * @param otherPokemonKey The key whose list we’re updating.
 * @param add True to add to not_trade_list, false to remove.
 * @returns The updated not_trade_list, or null if the other key didn’t exist.
 */
export function updateNotTradeList(
  instances: InstancesData,
  currentPokemonKey: string,
  otherPokemonKey: string,
  add: boolean
): Record<string, boolean> | null {
  const entry = instances[otherPokemonKey];
  if (!entry) {
    console.error(`No instance found for ${otherPokemonKey}`);
    return null;
  }

  const list = (entry.not_trade_list ?? {}) as Record<string, boolean>;
  if (add) {
    list[currentPokemonKey] = true;
  } else {
    delete list[currentPokemonKey];
  }
  entry.not_trade_list = list;
  return list;
}

/**
 * Toggles inclusion of currentPokemonKey in otherPokemonKey’s not_wanted_list.
 *
 * @param instances All Pokémon instances, keyed by instance ID.
 * @param currentPokemonKey The key of the current Pokémon.
 * @param otherPokemonKey The key whose list we’re updating.
 * @param add True to include, false to exclude.
 * @returns The updated not_wanted_list, or undefined if the other key didn’t exist.
 */
export function updateNotWantedList(
  instances: InstancesData,
  currentPokemonKey: string,
  otherPokemonKey: string,
  add: boolean
): Record<string, boolean> | undefined {
  const entry = instances[otherPokemonKey];
  if (!entry) {
    console.error(`No instance found for ${otherPokemonKey}`);
    return;
  }

  const list = (entry.not_wanted_list ?? {}) as Record<string, boolean>;
  list[currentPokemonKey] = add;
  entry.not_wanted_list = list;
  return list;
}
