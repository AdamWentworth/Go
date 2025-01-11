// PendingTradeView.jsx
import React from 'react';
import LoadingSpinner from '../../../components/LoadingSpinner';

const PendingTradeView = ({
  trade,
  offeringDetails,
  receivingCombinedDetails,
  loading,
  handleComplete,
  handleCancel
}) => (
  <div className="trade-card">
    <div className="trade-pokemon">
      <div className="pokemon offering">
        {trade.username_proposed && (
          <p className="receiving-username">{trade.username_proposed}</p>
        )}
        <h4>Offering:</h4>
        {offeringDetails ? (
          <>
            <img 
              src={offeringDetails.currentImage} 
              alt={offeringDetails.name || 'Offering Pokémon'} 
            />
            <p>{offeringDetails.name || offeringDetails.pokemon_name}</p>
          </>
        ) : loading ? (
          <LoadingSpinner />
        ) : (
          <p>Could not load offering details.</p>
        )}
      </div>

      <div className="trade-icon">
        <img 
          src="/images/pogo_trade_icon.png" 
          alt="Trade Icon" 
        />
      </div>

      <div className="pokemon received">
        {trade.username_accepting && (
          <p className="receiving-username">{trade.username_accepting}</p>
        )}
        <h4>Receiving:</h4>
        {receivingCombinedDetails ? (
          <>
            <img 
              src={receivingCombinedDetails.currentImage || receivingCombinedDetails.pokemon_image_url} 
              alt={receivingCombinedDetails.name || 'Receiving Pokémon'} 
            />
            <p>{receivingCombinedDetails.name || receivingCombinedDetails.pokemon_name}</p>
          </>
        ) : loading ? (
          <LoadingSpinner />
        ) : (
          <p>Could not load receiving details.</p>
        )}
      </div>
    </div>

    <div className="trade-actions">
      <button onClick={handleComplete}>Complete</button>
      <button onClick={handleCancel}>Cancel</button>
    </div>
  </div>
);

export default PendingTradeView;
