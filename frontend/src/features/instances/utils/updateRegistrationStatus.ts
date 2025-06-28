// updateRegistrationStatus.ts

import { oneWaySharedFormPokemonIDs } from '@/utils/constants';

import type { PokemonInstance }  from '@/types/pokemonInstance';
import type { Instances }    from '@/types/instances';

/**
 * Ensures that all related forms (shared dex‑numbers, shiny/shadow/costume
 * variants) share the same `registered` flag.
 */
export function updateRegistrationStatus(
  instance: PokemonInstance,
  instancesData: Instances,
): void {
  const originalId = instance.pokemon_id;

  // find which shared‑form group this Pokémon belongs to
  let sharedGroup: number[] | null = null;
  for (const key in oneWaySharedFormPokemonIDs) {
    const group = oneWaySharedFormPokemonIDs[+key];
    if (group.includes(originalId)) {
      sharedGroup = group;
      break;
    }
  }
  if (!sharedGroup) return;

  /* -------------------------------------------------------------- */
  /* 1) check if *any* matching variant is already registered       */
  /* -------------------------------------------------------------- */
  let anyRegistered = instance.registered;

  Object.values(instancesData).forEach((other) => {
    if (other === instance) return;
    if (!sharedGroup!.includes(other.pokemon_id)) return;

    const sameShiny    = other.shiny    === instance.shiny;
    const sameShadow   = other.shadow   === instance.shadow;
    const sameCostume  = other.costume_id === instance.costume_id;

    if (sameShiny && sameShadow && sameCostume && other.registered) {
      anyRegistered = true;
    }
  });

  /* -------------------------------------------------------------- */
  /* 2) propagate the flag to all matching variants                 */
  /* -------------------------------------------------------------- */
  if (anyRegistered) {
    instance.registered = true;
    Object.values(instancesData).forEach((other) => {
      if (other === instance) return;
      if (!sharedGroup!.includes(other.pokemon_id)) return;

      const sameShiny   = other.shiny   === instance.shiny;
      const sameShadow  = other.shadow  === instance.shadow;
      const sameCostume = other.costume_id === instance.costume_id;

      if (sameShiny && sameShadow && sameCostume) {
        other.registered = true;
      }
    });
  }
}
