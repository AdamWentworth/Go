// src/features/fusion/services/createFusionInstance.ts
import { getVariantById } from '@/db/indexedDB';
import { createNewInstanceData } from '@/features/instances/utils/createNewInstanceData';
import { generateUUID } from '@/utils/PokemonIDUtils';
import { PokemonInstance } from '@/types/pokemonInstance';
import { PokemonVariant } from '@/types/pokemonVariants';

type CreateFusionInstanceParams = {
  variantKey: string; // kept param name for route compatibility
  isShiny: boolean;
  updateDetails: (id: string, data: PokemonInstance) => Promise<void>;
};

/**
 * Creates a new Pokémon instance for fusion (left or right), enriches it, and returns it.
 */
export async function createFusionInstance({
  variantKey,
  isShiny,
  updateDetails,
}: CreateFusionInstanceParams) {
  const variantData = (await getVariantById(variantKey)) as PokemonVariant;
  if (!variantData) {
    throw new Error(`[Fusion] No variant data for key: ${variantKey}`);
  }

  const newInstanceData: PokemonInstance = createNewInstanceData(variantData);
  const uuid = generateUUID();
  const instanceId = `${variantData.variant_id}_${uuid}`;

  newInstanceData.instance_id = instanceId;
  newInstanceData.is_owned = true;
  newInstanceData.is_unowned = false;
  newInstanceData.is_for_trade = false;
  newInstanceData.shiny = isShiny;

  await updateDetails(instanceId, newInstanceData);

  const enriched = (await getVariantById(variantKey)) as PokemonVariant;
  if (!enriched) {
    throw new Error(`[Fusion] Could not re-fetch variant data for ${variantKey}`);
  }

  return {
    ...enriched,
    instanceData: newInstanceData,
  };
}
