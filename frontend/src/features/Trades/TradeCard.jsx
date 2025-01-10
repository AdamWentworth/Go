// TradeCard.jsx
import React from 'react';
import { usePokemonData } from '../../contexts/PokemonDataContext';
import { useOfferingDetails } from './hooks/useOfferingDetails';
import { useReceivingDetails } from './hooks/useReceivingDetails';
import './TradeList.css';  // Reuse the same CSS for styling if applicable

function TradeCard({ trade, relatedInstances }) {
  const { variants, ownershipData } = usePokemonData();

  const offeringDetails = useOfferingDetails(trade, variants, ownershipData);
  const receivingCombinedDetails = useReceivingDetails(trade, variants, relatedInstances);

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
              <img 
                src={offeringDetails.currentImage} 
                alt={offeringDetails.name || 'Offering Pokémon'} 
              />
              <p>{offeringDetails.name || offeringDetails.pokemon_name}</p>
            </>
          ) : (
            <p>Loading offering details...</p>
          )}
        </div>
        <div className="pokemon received">
          <h4>Receiving:</h4>
          {receivingCombinedDetails ? (
            <>
              <img 
                src={receivingCombinedDetails.currentImage || receivingCombinedDetails.pokemon_image_url} 
                alt={receivingCombinedDetails.name || 'Receiving Pokémon'} 
              />
              <p>{receivingCombinedDetails.name || receivingCombinedDetails.pokemon_name}</p>
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
