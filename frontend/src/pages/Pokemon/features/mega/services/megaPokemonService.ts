// megaPokemonService.ts
import { getVariantById } from '@/db/variantsDB';
import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { useTagsStore } from '@/features/tags/store/useTagsStore';
import { createNewInstanceData } from '@/features/instances/utils/createNewInstanceData';
import { generateUUID } from '@/utils/PokemonIDUtils';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { PokemonInstance } from '@/types/pokemonInstance';

/** Mega-evolve an existing instance */
export async function megaEvolveExisting(
  instanceId: string,
  megaForm?: string,
) {
  const updateDetails = useInstancesStore.getState().updateInstanceDetails;
  const updateTags   = useTagsStore.getState().buildTags;

  const payload: Record<string, Partial<PokemonInstance>> = {
    [instanceId]: {
      mega      : true,
      is_mega   : true,
      ...(megaForm && { mega_form: megaForm }),
    },
  };

  await updateDetails(payload as unknown as Record<string, PokemonInstance>);
  await updateTags();
}

/** Create a brand-new (shiny-safe) instance and mark it Mega */
export async function createNewMega(
  variantKey: string,
  megaForm?: string,
): Promise<string /* instance_id */> {
  const variant = await getVariantById<PokemonVariant>(variantKey);
  if (!variant) throw new Error(`Variant data not found for key: ${variantKey}`);

  const data       = createNewInstanceData(variant);
  const uuid       = generateUUID();
  const instanceId = `${variant.variant_id}_${uuid}`;

  Object.assign(data, {
    instance_id  : instanceId,
    mega         : true,
    is_mega      : true,
    is_caught    : true,
    ...(megaForm && { mega_form: megaForm }),
  });

  const updateDetails = useInstancesStore.getState().updateInstanceDetails;
  await updateDetails({ [instanceId]: data });

  return instanceId;
}
