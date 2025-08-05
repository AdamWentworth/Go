// src/features/instances/services/updatePokemonInstanceStatus.ts
import { generateUUID, validateUUID } from '@/utils/PokemonIDUtils';
import { createNewInstanceData } from '../utils/createNewInstanceData';
import { updateRegistrationStatus } from '../utils/updateRegistrationStatus';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { InstanceStatus } from '@/types/instances';
import type { Instances } from '@/types/instances';
import type { PokemonInstance } from '@/types/pokemonInstance';

/**
 * Updates status flags for a Pokémon instance.
 * `target` may be an instance UUID or a variant_id (e.g. "0583-shiny").
 *
 * Returns the instance_id that was updated/created, or null on abort.
 */
export function updatePokemonInstanceStatus(
  target: string,
  newStatus: InstanceStatus,           // still using "Owned"|"Trade"|"Wanted"|"Unowned" labels
  variants: PokemonVariant[],
  instances: Instances,
): string | null {
  const isUuid = validateUUID(target);

  let instanceId: string | null = null;
  let variantKey: string | null = null;
  let instance: PokemonInstance | undefined;

  if (isUuid) {
    instanceId  = target;
    instance    = instances[instanceId];
    variantKey  = instance?.variant_id ?? null;
  } else {
    variantKey  = target; // treating input as variant_id
    // Try to reuse a placeholder of the same variant (previously "unowned-only")
    instanceId  = Object.keys(instances).find(
      id => instances[id]?.variant_id === variantKey &&
            !instances[id]?.registered &&
            !instances[id]?.is_wanted && !instances[id]?.is_for_trade && !instances[id]?.is_caught
    ) ?? null;
    instance    = instanceId ? instances[instanceId] : undefined;
  }

  const variantData = variants.find(v => v.pokemonKey === variantKey) ?? null;
  if (!variantData) {
    console.error('[updatePokemonInstanceStatus] No variant for', variantKey);
    return null;
  }

  if (!instanceId) {
    instanceId = generateUUID();
    const base = createNewInstanceData(variantData);
    base.instance_id = instanceId;
    instances[instanceId] = base;
    instance = base;
  }

  // Derive some flags from variantKey
  const vkey = (variantKey ?? '').toLowerCase();
  if (instance!.pokemon_id === 2301 || instance!.pokemon_id === 2302) {
    instance!.purified = vkey.includes('default');
  }
  instance!.dynamax    = vkey.includes('dynamax');
  instance!.gigantamax = vkey.includes('gigantamax');

  // Constraints for moving into Trade/Wanted
  if (['Trade', 'Wanted'].includes(newStatus)) {
    if (
      instance!.lucky ||
      instance!.shadow ||
      instance!.is_mega ||
      instance!.mega ||
      [2270, 2271].includes(instance!.pokemon_id) // fusions
    ) {
      alert(
        `Cannot move ${variantKey} to ${newStatus} as it is ${
          instance!.lucky ? 'lucky'
          : instance!.shadow ? 'shadow'
          : (instance!.is_mega || instance!.mega) ? 'mega'
          : 'a fusion Pokémon'
        }.`
      );
      console.log('[update] blocked due to special status');
      return instanceId;
    }
  }

  switch (newStatus) {
    case 'Owned': // maps to "caught" in the new model
      instance!.is_caught    = true;
      instance!.is_for_trade = false;
      instance!.is_wanted    = false;
      instance!.registered   = true;
      // Turn off "missing" state on siblings of same variant (i.e., mark them registered=false only if truly missing)
      for (const id of Object.keys(instances)) {
        if (id === instanceId) continue;
        const other = instances[id];
        if (other?.variant_id === variantKey) {
          // sibling exists; do not force registered here, just clear "missing" logic if your app tracks it elsewhere
        }
      }
      break;

    case 'Trade':
      instance!.is_caught    = true;     // caught but flagged for trade
      instance!.is_for_trade = true;
      instance!.is_wanted    = false;
      instance!.registered   = true;
      break;

    case 'Wanted':
      if (instance!.is_caught) {
        // Duplicate into a new UUID row (same variant) flagged as wanted
        const newId = generateUUID();
        instances[newId] = {
          ...instance!,
          instance_id: newId,
          is_wanted: true,
          is_caught: false,
          is_for_trade: false,
          registered: true,       // wanted entries are considered registered for tags logic
          last_update: Date.now(),
        };
        updateRegistrationStatus(instances[newId], instances);
        updateRegistrationStatus(instance!, instances);
        return newId;
      } else {
        instance!.is_wanted  = true;
        // If any sibling of same variant is caught, we keep this registered as well
        const anyCaught = Object.values(instances).some(
          (d) => d?.variant_id === variantKey && d.is_caught
        );
        instance!.registered = instance!.is_caught || instance!.is_for_trade || instance!.is_wanted || anyCaught;
        return instanceId!;
      }

    case 'Unowned': // legacy label — interpret as "missing/unregistered"
      instance!.is_caught    = false;
      instance!.is_for_trade = false;
      instance!.is_wanted    = false;
      instance!.registered   = false;
      break;
  }

  // Registered when any of the “visible” states are set
  instance!.registered =
    instance!.is_caught ||
    instance!.is_for_trade ||
    instance!.is_wanted ||
    !!instance!.registered;

  updateRegistrationStatus(instance!, instances);
  return instanceId!;
}
