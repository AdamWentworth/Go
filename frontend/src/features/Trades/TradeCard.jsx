import React, { useEffect, useState } from 'react';
import { getFromDB } from '../../services/indexedDB';  
import { parsePokemonKey } from '../../utils/PokemonIDUtils';
import './TradeList.css';  // Reuse the same CSS for styling if applicable

function TradeCard({ trade, relatedInstances }) {
  const [offeringDetails, setOfferingDetails] = useState(null);
  const [receivingCombinedDetails, setReceivingCombinedDetails] = useState(null);

  useEffect(() => {
    async function fetchOfferingData() {
      try {
        // Parse the offering key
        const parsed = parsePokemonKey(trade.pokemon_instance_id_user_proposed);
        console.log('Parsed offering key:', parsed);

        // Retrieve variant data using baseKey from 'pokemonVariants'
        const variantData = await getFromDB('pokemonVariants', parsed.baseKey);
        console.log('Variant data for offering:', variantData);

        // Retrieve ownership data using full instance id from 'pokemonOwnership'
        const ownershipKey = String(trade.pokemon_instance_id_user_proposed);
        const ownershipData = await getFromDB('pokemonOwnership', ownershipKey);
        console.log('Ownership data for offering:', ownershipData);

        // Combine variant and ownership data
        const combinedDetails = {
          ...variantData,
          ...ownershipData
        };

        console.log('Combined offering details:', combinedDetails);
        setOfferingDetails(combinedDetails);
      } catch (error) {
        console.error('Error fetching offering details:', error);
      }
    }
    fetchOfferingData();
  }, [trade]);

  useEffect(() => {
    async function fetchReceivingData() {
      try {
        // Parse the receiving key
        const parsedReceiving = parsePokemonKey(trade.pokemon_instance_id_user_accepting);
        console.log('Parsed receiving key:', parsedReceiving);

        // Retrieve variant data for receiving Pokémon using baseKey from 'pokemonVariants'
        const variantReceivingData = await getFromDB('pokemonVariants', parsedReceiving.baseKey);
        console.log('Variant data for receiving:', variantReceivingData);

        // Use relatedInstances prop to get existing receiving details
        const existingReceivingDetails = relatedInstances 
          ? relatedInstances[trade.pokemon_instance_id_user_accepting] 
          : null;
        console.log('Existing receiving details:', existingReceivingDetails);

        // Combine variant data and existing receiving details
        const combinedReceiving = {
          ...variantReceivingData,
          ...existingReceivingDetails
        };

        console.log('Combined receiving details:', combinedReceiving);
        setReceivingCombinedDetails(combinedReceiving);
      } catch (error) {
        console.error('Error fetching receiving details:', error);
      }
    }

    fetchReceivingData();
  }, [trade, relatedInstances]);

  return (
    <div className="trade-card">
      <div className="trade-info">
        <p><strong>Trade ID:</strong> {trade.trade_id}</p>
        <p><strong>Status:</strong> {trade.trade_status}</p>
        {/* Additional trade info if needed */}
      </div>
      <div className="trade-pokemon">
        <div className="pokemon offering">
          <h4>Offering:</h4>
          {offeringDetails ? (
            <>
              <img src={offeringDetails.currentImage} alt={offeringDetails.name || 'Offering Pokémon'} />
              <p>{offeringDetails.name}</p>
            </>
          ) : (
            <p>Loading offering details...</p>
          )}
        </div>
        <div className="pokemon received">
          <h4>Receiving:</h4>
          {receivingCombinedDetails ? (
            <>
              <img src={receivingCombinedDetails.currentImage} alt={receivingCombinedDetails.name || 'Receiving Pokémon'} />
              <p>{receivingCombinedDetails.name}</p>
            </>
          ) : (
            <p>Loading receiving details...</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default TradeCard;
