// OffersTradeView.jsx
import React from 'react';
import LoadingSpinner from '../../../components/LoadingSpinner';
import './OffersTradeView.css';

const OffersTradeView = ({
  trade,
  currentUsername,
  offeringDetails,
  receivingCombinedDetails,
  loading,
  handleAccept,
  handleDeny
}) => (
  <div className="trade-card offers-trade-view">
    <div className="trade-pokemon">
      <div className="pokemon offering">
        {currentUsername && (
          <p className="receiving-username">{currentUsername}</p>
        )}
        <h4>For Trade:</h4>
        {receivingCombinedDetails ? (
          <>
            <img 
              src={receivingCombinedDetails.currentImage || receivingCombinedDetails.pokemon_image_url} 
              alt={receivingCombinedDetails.name || 'Offering Pokémon'} 
            />
            <p>{receivingCombinedDetails.name || receivingCombinedDetails.pokemon_name}</p>
          </>
        ) : loading ? (
          <LoadingSpinner />
        ) : (
          <p>Could not load offering details.</p>
        )}
      </div>

      <div className="center-column">
        <div className="trade-icon">
          <img src="/images/pogo_trade_icon.png" alt="Trade Icon" />
        </div>
      </div>

      <div className="pokemon received">
        {trade.username_proposed && (
          <p className="receiving-username">{trade.username_proposed}</p>
        )}
        <h4>Offered:</h4>
        {offeringDetails ? (
          <>
            <img 
              src={offeringDetails.currentImage} 
              alt={offeringDetails.name || 'Receiving Pokémon'} 
            />
            <p>{offeringDetails.name || offeringDetails.pokemon_name}</p>
          </>
        ) : loading ? (
          <LoadingSpinner />
        ) : (
          <p>Could not load receiving details.</p>
        )}
      </div>
    </div>

    <div className="trade-actions">
      <button className="accept-button" onClick={handleAccept}>Accept</button>
      <button className="deny-button" onClick={handleDeny}>Deny</button>
    </div>
  </div>
);

export default OffersTradeView;
