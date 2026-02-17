// src/features/instances/services/updatePokemonInstanceStatus.ts
import { generateUUID, validateUUID } from '@/utils/PokemonIDUtils';
import { createScopedLogger } from '@/utils/logger';
import { createNewInstanceData } from '../utils/createNewInstanceData';
import { updateRegistrationStatus } from '../utils/updateRegistrationStatus';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { InstanceStatus } from '@/types/instances';
import type { Instances } from '@/types/instances';
import type { PokemonInstance } from '@/types/pokemonInstance';

const log = createScopedLogger('updatePokemonInstanceStatus');

/**
 * Updates status flags for a Pokémon instance.
 * target may be an instance UUID or a variant_id (e.g. "0583-shiny").
 *
 * Returns the instance_id that was updated/created, or null on abort.
 */
export function updatePokemonInstanceStatus(
  target: string,
  newStatus: InstanceStatus, // "Caught" | "Trade" | "Wanted" | "Missing"
  variants: PokemonVariant[],
  instances: Instances,
): string | null {
  const isUuid = validateUUID(target);

  let instanceId: string | null = null;
  let variantKey: string | null = null;
  let instance: PokemonInstance | undefined;

  if (isUuid) {
    instanceId  = target;
    instance    = (instances as any)[instanceId];
    variantKey  = instance?.variant_id ?? null;
  } else {
    variantKey  = target; // treating input as variant_id
    // Try to reuse a placeholder of the same variant (baseline row)
    for (const id in instances) {
      const row = (instances as any)[id];
      if (!row) continue;
      if (row.variant_id === variantKey && !row.registered && !row.is_wanted && !row.is_for_trade && !row.is_caught) {
        instanceId = id;
        break;
      }
    }
    instance    = instanceId ? (instances as any)[instanceId] : undefined;
  }

  const variantData = variants.find(v => v.variant_id === variantKey) ?? null;
  if (!variantData) {
    log.error('No variant for', variantKey);
    return null;
  }

  if (!instanceId) {
    instanceId = generateUUID();
    const base = createNewInstanceData(variantData);
    base.instance_id = instanceId;
    (instances as any)[instanceId] = base;
    instance = base;
  }

  // Derive some flags from variantKey
  const vkey = (variantKey ?? '').toLowerCase();
  if ((instance as any).pokemon_id === 2301 || (instance as any).pokemon_id === 2302) {
    (instance as any).purified = vkey.includes('default');
  }
  (instance as any).dynamax    = vkey.includes('dynamax');
  (instance as any).gigantamax = vkey.includes('gigantamax');

  // Constraints for moving into Trade/Wanted
  if (['Trade', 'Wanted'].includes(newStatus)) {
    if (
      (instance as any).lucky ||
      (instance as any).shadow ||
      (instance as any).is_mega ||
      (instance as any).mega ||
      [2270, 2271].includes((instance as any).pokemon_id) // fusions
    ) {
      alert(
        `Cannot move ${variantKey} to ${newStatus} as it is ${
          (instance as any).lucky ? 'lucky'
          : (instance as any).shadow ? 'shadow'
          : ((instance as any).is_mega || (instance as any).mega) ? 'mega'
          : 'a fusion Pokémon'
        }.`
      );
      log.debug('Update blocked due to special status');
      return instanceId;
    }
  }

  switch (newStatus) {
    case 'Caught':
      (instance as any).is_caught    = true;
      (instance as any).is_for_trade = false;
      (instance as any).is_wanted    = false;
      (instance as any).registered   = true;
      break;

    case 'Trade':
      (instance as any).is_caught    = true;     // caught but flagged for trade
      (instance as any).is_for_trade = true;
      (instance as any).is_wanted    = false;
      (instance as any).registered   = true;
      break;

    case 'Wanted':
      if ((instance as any).is_caught) {
        const newId = generateUUID();
        (instances as any)[newId] = {
          ...(instance as any),
          instance_id: newId,
          is_wanted: true,
          is_caught: false,
          is_for_trade: false,
          registered: true,       // wanted entries are considered registered for tags logic
          last_update: new Date().toISOString(),
        };
        updateRegistrationStatus((instances as any)[newId], instances);
        updateRegistrationStatus(instance as any, instances);
        return newId;
      } else {
        (instance as any).is_wanted  = true;
        const anyCaught = Object.values(instances).some(
          (d: any) => d?.variant_id === variantKey && d.is_caught
        );
        (instance as any).registered =
          (instance as any).is_caught || (instance as any).is_for_trade || (instance as any).is_wanted || anyCaught;
        return instanceId!;
      }

    case 'Missing': // baseline / not registered
      (instance as any).is_caught    = false;
      (instance as any).is_for_trade = false;
      (instance as any).is_wanted    = false;
      (instance as any).registered   = false;
      break;
  }

  // Registered when any of the “visible” states are set
  (instance as any).registered =
    (instance as any).is_caught ||
    (instance as any).is_for_trade ||
    (instance as any).is_wanted ||
    !!(instance as any).registered;

  updateRegistrationStatus(instance as any, instances);
  return instanceId!;
}
