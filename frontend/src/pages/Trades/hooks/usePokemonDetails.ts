import { useEffect, useState } from 'react';
import { parseVariantId } from '../../../utils/PokemonIDUtils';
import { findVariantForInstance } from '../../Search/utils/findVariantForInstance';
import type { PokemonVariant } from '@/types/pokemonVariants';

type VariantLike = Record<string, unknown> & {
  moves?: unknown[];
};

type InstanceLike = Record<string, unknown> & {
  variant_id?: string;
};

type VariantsInput = PokemonVariant[] | Record<string, VariantLike> | null | undefined;
type InstancesMap = Record<string, InstanceLike> | null | undefined;

type PokemonDetails = VariantLike & InstanceLike & {
  moves: unknown[];
};

export function usePokemonDetails(
  instanceId: string | null | undefined,
  variants: VariantsInput,
  relatedInstances: InstancesMap,
  instances: InstancesMap,
): PokemonDetails | null {
  const [details, setDetails] = useState<PokemonDetails | null>(null);

  useEffect(() => {
    if (!variants || !instanceId) {
      setDetails(null);
      return;
    }

    const instancesMap = instances || {};

    const instanceDetails: InstanceLike =
      (relatedInstances && relatedInstances[instanceId]) ||
      (instancesMap && instancesMap[instanceId]) ||
      {};

    const parsed = parseVariantId(instanceId);
    const variantLookupKey = instanceDetails?.variant_id || parsed.baseKey || instanceId;

    const variantFromMap =
      !Array.isArray(variants) && typeof variants === 'object'
        ? variants[variantLookupKey]
        : undefined;

    const variantData: VariantLike =
      variantFromMap ||
      (Array.isArray(variants) &&
        (findVariantForInstance(
          variants,
          variantLookupKey,
          instanceDetails,
        ) as VariantLike | null)) ||
      {};

    const mergedDetails: PokemonDetails = {
      ...variantData,
      ...instanceDetails,
      moves: Array.isArray(variantData?.moves) ? variantData.moves : [],
    };

    setDetails(mergedDetails);
  }, [instanceId, variants, relatedInstances, instances]);

  return details;
}
