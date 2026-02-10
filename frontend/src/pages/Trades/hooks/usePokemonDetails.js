// hooks/usePokemonDetails.js
import { useEffect, useState } from 'react';
import { parsePokemonKey } from '../../../utils/PokemonIDUtils';

export function usePokemonDetails(instanceId, variants, relatedInstances, ownershipData) {
  const [details, setDetails] = useState(null);

  useEffect(() => {
    if (!variants || !instanceId) {
      setDetails(null);
      return;
    }

    const parsed = parsePokemonKey(instanceId);

    const variantData =
      variants[parsed.baseKey] ||
      (Array.isArray(variants) &&
        variants.find(
          v => (v.variant_id ?? v.pokemonKey) === parsed.baseKey,
        ));

    // Check relatedInstances or ownershipData for the instance
    const instanceDetails =
      (relatedInstances && relatedInstances[instanceId]) ||
      (ownershipData && ownershipData[instanceId]) ||
      {};

    setDetails({ ...variantData, ...instanceDetails });
  }, [instanceId, variants, relatedInstances, ownershipData]);

  return details;
}
