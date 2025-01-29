// useForTradeDetails.js
import { useEffect, useState } from 'react';
import { parsePokemonKey } from '../../../utils/PokemonIDUtils';

export function useForTradeDetails(trade, variants, ownershipData) {
  const [offeringDetails, setOfferingDetails] = useState(null);

  useEffect(() => {
    if (!variants || !ownershipData) return;

    // Parse the offering key
    const parsed = parsePokemonKey(trade.pokemon_instance_id_user_accepting);

    // Lookup variant data using baseKey from variants
    const variantData =
      variants[parsed.pokemonKey] ||
      (Array.isArray(variants)
        ? variants.find(v => v.pokemonKey === parsed.baseKey)
        : null);

    // Retrieve ownership data for the offering Pokémon
    const offeringOwnership = ownershipData[trade.pokemon_instance_id_user_accepting];

    // Combine variant and ownership data
    const combinedDetails = {
      ...variantData,
      ...offeringOwnership
    };

    setOfferingDetails(combinedDetails);
  }, [trade, variants, ownershipData]);

  return offeringDetails;
}
