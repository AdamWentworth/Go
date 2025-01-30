// hooks/usePokemonDetails.js
import { useEffect, useState } from 'react';
import { parsePokemonKey } from '../../../utils/PokemonIDUtils';

export function usePokemonDetails(trade, instanceIdKey, variants, relatedInstances, ownershipData) {
  const [details, setDetails] = useState(null);

  useEffect(() => {
    if (!variants || !trade[instanceIdKey]) {
      setDetails(null);
      return;
    }

    // Parse Pokémon instance ID
    const parsed = parsePokemonKey(trade[instanceIdKey]);
    
    // Find variant data
    const variantData = variants[parsed.pokemonKey] || 
      (Array.isArray(variants) && variants.find(v => v.pokemonKey === parsed.baseKey));

    // Get instance details (check relatedInstances first)
    const instanceDetails = relatedInstances?.[trade[instanceIdKey]] || ownershipData?.[trade[instanceIdKey]] || {};

    setDetails({ ...variantData, ...instanceDetails });
  }, [trade, instanceIdKey, variants, relatedInstances, ownershipData]);

  return details;
}