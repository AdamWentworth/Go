// useReceivingDetails.js
import { useEffect, useState } from 'react';
import { parsePokemonKey } from '../../../utils/PokemonIDUtils';

export function useReceivingDetails(trade, variants, relatedInstances) {
  const [receivingDetails, setReceivingDetails] = useState(null);

  useEffect(() => {
    if (!variants) return;

    // Parse the receiving key
    const parsedReceiving = parsePokemonKey(trade.pokemon_instance_id_user_accepting);

    // Lookup variant data for receiving Pokémon using baseKey
    const variantReceivingData =
      variants[parsedReceiving.pokemonKey] ||
      (Array.isArray(variants)
        ? variants.find(v => v.pokemonKey === parsedReceiving.baseKey)
        : null);

    // Use relatedInstances prop to get existing receiving details
    const existingReceivingDetails = relatedInstances
      ? relatedInstances[trade.pokemon_instance_id_user_accepting]
      : null;

    // Combine variant data and existing receiving details
    const combinedReceiving = {
      ...variantReceivingData,
      ...existingReceivingDetails };

      setReceivingDetails(combinedReceiving);
  }, [trade, variants, relatedInstances]);

  return receivingDetails;
}
