// hooks/usePokemonDetails.js
import { useEffect, useState } from 'react';
import { parsePokemonKey } from '../../../utils/PokemonIDUtils';
import { findVariantForInstance } from '../../Search/utils/findVariantForInstance';

export function usePokemonDetails(
  instanceId,
  variants,
  relatedInstances,
  instances
) {
  const [details, setDetails] = useState(null);

  useEffect(() => {
    if (!variants || !instanceId) {
      setDetails(null);
      return;
    }

    const instancesMap = instances || {};

    // Check relatedInstances or instances map for the instance
    const instanceDetails =
      (relatedInstances && relatedInstances[instanceId]) ||
      (instancesMap && instancesMap[instanceId]) ||
      {};

    const parsed = parsePokemonKey(instanceId);
    const variantLookupKey = instanceDetails?.variant_id || parsed.baseKey || instanceId;

    const variantData =
      variants[variantLookupKey] ||
      (Array.isArray(variants) &&
        findVariantForInstance(variants, variantLookupKey, instanceDetails));

    const mergedDetails = { ...variantData, ...instanceDetails };
    if (!Array.isArray(mergedDetails.moves)) {
      mergedDetails.moves = Array.isArray(variantData?.moves) ? variantData.moves : [];
    }

    setDetails(mergedDetails);
  }, [instanceId, variants, relatedInstances, instances]);

  return details;
}
