// updatePokemonInstanceStatus.ts

import { generateUUID, parsePokemonKey } from '@/utils/PokemonIDUtils';
import { createNewInstanceData } from '../utils/createNewInstanceData';
import { updateRegistrationStatus } from '../utils/updateRegistrationStatus';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { InstanceStatus } from '@/types/instances';
import type { Instances } from '@/types/instances';
import type { PokemonInstance } from '@/types/pokemonInstance';

/* -------------------------------------------------------------------------- */
/*  Public API                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Updates the status flags (owned / wanted / trade…) of a Pokémon instance.
 *
 * Returns the instance key that was actually updated (can be a brand‑new UUID)
 * or `null` if the operation was aborted.
 */
export function updatePokemonInstanceStatus(
  pokemonKey: string,
  newStatus: InstanceStatus,
  variants: PokemonVariant[],
  instances: Instances,
): string | null {
  const { baseKey, hasUUID } = parsePokemonKey(pokemonKey);
  const variantData = variants.find((v) => v.pokemonKey === baseKey);

  if (!variantData) {
    console.error('[updatePokemonInstanceStatus] No variant for', baseKey);
    return null;
  }

  console.log('[updatePokemonInstanceStatus] Processing', pokemonKey);

  return hasUUID
    ? handleUuidEntry(pokemonKey, newStatus, instances, baseKey)
    : handleBaseKeyEntry(pokemonKey, newStatus, instances, variantData);
}

/* -------------------------------------------------------------------------- */
/*  Helper logic                                                              */
/* -------------------------------------------------------------------------- */

function handleBaseKeyEntry(
  pokemonKey: string,
  newStatus: InstanceStatus,
  data: Instances,
  variantData: PokemonVariant,
): string {
  let needNew = true;
  let updated = '';

  for (const key of Object.keys(data)) {
    const prefix = key.split('_').slice(0, -1).join('_');
    if (prefix === pokemonKey && data[key].is_unowned && !data[key].is_wanted) {
      applyStatus(key, newStatus, data, pokemonKey);
      updated = key;
      needNew = false;
    }
  }

  if (needNew) {
    const newKey = `${pokemonKey}_${generateUUID()}`;
    data[newKey] = createNewInstanceData(variantData) as PokemonInstance;
    applyStatus(newKey, newStatus, data, pokemonKey);
    updated = newKey;
  }

  return updated;
}

function applyStatus(
  pokemonKey: string,
  newStatus: InstanceStatus,
  data: Instances,
  baseKey: string,
): void {
  const instance = data[pokemonKey];

  // Purified flag only for shadow lines 2301/2302
  if (baseKey.startsWith('2301') || baseKey.startsWith('2302')) {
    instance.purified = baseKey.toLowerCase().includes('default');
  }

  instance.dynamax = baseKey.toLowerCase().includes('dynamax');
  instance.gigantamax = baseKey.toLowerCase().includes('gigantamax');

  if (['Trade', 'Wanted'].includes(newStatus)) {
    if (
      instance.lucky ||
      instance.shadow ||
      instance.is_mega ||
      instance.mega ||
      [2270, 2271].includes(instance.pokemon_id)
    ) {
      alert(
        `Cannot move ${pokemonKey} to ${newStatus} as it is ${
          instance.lucky
            ? 'lucky'
            : instance.shadow
            ? 'shadow'
            : instance.is_mega || instance.mega
            ? 'mega'
            : 'a fusion Pokémon'
        }.`
      );
      console.log('[update] blocked due to special status');
      return;
    }
  }

  instance.is_unowned = newStatus === 'Unowned';
  instance.is_owned = ['Owned', 'Trade'].includes(newStatus);
  instance.is_for_trade = newStatus === 'Trade';
  instance.is_wanted = newStatus === 'Wanted';

  for (const key of Object.keys(data)) {
    const prefix = key.split('_').slice(0, -1).join('_');
    if (prefix === baseKey && key !== pokemonKey) {
      switch (newStatus) {
        case 'Unowned':
          data[key].is_owned = false;
          data[key].is_for_trade = false;
          break;
        case 'Owned':
        case 'Trade':
          data[key].is_unowned = false;
          break;
        case 'Wanted':
          if (data[key].is_owned) instance.is_unowned = false;
          break;
      }
    }
  }

  if (newStatus === 'Trade' && !instance.is_owned) instance.is_owned = true;

  if (newStatus === 'Wanted') {
    const anyOwned = Object.keys(data).some((k) => {
      const prefix = k.split('_').slice(0, -1).join('_');
      return data[k].is_owned && prefix === baseKey;
    });
    instance.is_unowned = !anyOwned;
  }

  instance.registered =
    instance.is_owned ||
    instance.is_for_trade ||
    (instance.is_wanted && !instance.is_unowned);

  updateRegistrationStatus(instance, data);
}

function handleUuidEntry(
  pokemonKey: string,
  newStatus: InstanceStatus,
  data: Instances,
  baseKey: string,
): string {
  const instance = data[pokemonKey];

  // Purified flag only for shadow lines 2301/2302
  if (baseKey.startsWith('2301') || baseKey.startsWith('2302')) {
    instance.purified = baseKey.toLowerCase().includes('default');
  }

  instance.dynamax = baseKey.toLowerCase().includes('dynamax');
  instance.gigantamax = baseKey.toLowerCase().includes('gigantamax');

  if (['Trade', 'Wanted'].includes(newStatus)) {
    if (
      instance.lucky ||
      instance.shadow ||
      instance.is_mega ||
      instance.mega ||
      [2270, 2271].includes(instance.pokemon_id)
    ) {
      alert(
        `Cannot move ${pokemonKey} to ${newStatus} as it is ${
          instance.lucky
            ? 'lucky'
            : instance.shadow
            ? 'shadow'
            : instance.is_mega || instance.mega
            ? 'mega'
            : 'a fusion Pokémon'
        }.`
      );
      console.log('[update] blocked due to special status');
      return pokemonKey;
    }
  }

  switch (newStatus) {
    case 'Owned':
      instance.is_owned = true;
      instance.is_for_trade = false;
      instance.is_unowned = false;
      instance.is_wanted = false;
      // Update siblings
      for (const key of Object.keys(data)) {
        const prefix = key.split('_').slice(0, -1).join('_');
        if (prefix === baseKey && key !== pokemonKey) {
          data[key].is_unowned = false;
        }
      }
      break;
    case 'Trade':
      instance.is_owned = true;
      instance.is_for_trade = true;
      instance.is_unowned = false;
      instance.is_wanted = false;
      break;
    case 'Wanted':
      if (instance.is_owned) {
        const basePrefix = pokemonKey.split('_').slice(0, -1).join('_');
        const newKey = `${basePrefix}_${generateUUID()}`;
        instance.is_unowned = false; // Ensure original owned instance has is_unowned: false
        data[newKey] = {
          ...instance,
          is_wanted: true,
          is_owned: false,
          is_for_trade: false,
          is_unowned: false,
          registered: true,
        };
        updateRegistrationStatus(data[newKey], data);
        updateRegistrationStatus(instance, data); // Update registration for original instance
        return newKey;
      } else {
        instance.is_wanted = true;
        const prefix = pokemonKey.split('_').slice(0, -1).join('_');
        const anyOwned = Object.values(data).some(
          (d) => d.is_owned && d.pokemonKey?.startsWith(prefix),
        );
        instance.is_unowned = !anyOwned;
        instance.registered = instance.is_owned || instance.is_for_trade || (instance.is_wanted && !instance.is_unowned);
        return pokemonKey;
      }
    case 'Unowned':
      instance.is_unowned = true;
      instance.is_owned = false;
      instance.is_for_trade = false;
      instance.is_wanted = false;
      break;
  }

  instance.registered =
    instance.is_owned ||
    instance.is_for_trade ||
    (instance.is_wanted && !instance.is_unowned);

  updateRegistrationStatus(instance, data);
  return pokemonKey;
}