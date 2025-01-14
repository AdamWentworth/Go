// PendingTradeView.jsx

import React, { useState } from 'react';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { revealPartnerInfo } from '../../../services/tradeService';

const PendingTradeView = ({
  trade,
  offeringDetails,
  receivingCombinedDetails,
  loading,
  handleComplete,
  handleCancel
}) => {
  const [partnerInfo, setPartnerInfo] = useState(null);
  const [error, setError] = useState(null);
  const [revealInProgress, setRevealInProgress] = useState(false);

  const handleRevealInfo = async () => {
    setRevealInProgress(true);
    setError(null);

    try {
      // Pass the entire trade object
      const data = await revealPartnerInfo(trade);
      // data might be: { trainerCode: '1234-5678-9999', pokemonGoName: 'PikaPro' }
      setPartnerInfo(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setRevealInProgress(false);
    }
  };

  return (
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
          <img src="/images/pogo_trade_icon.png" alt="Trade Icon" />
        </div>

        <div className="pokemon received">
          {trade.username_accepting && (
            <p className="receiving-username">{trade.username_accepting}</p>
          )}
          <h4>Receiving:</h4>
          {receivingCombinedDetails ? (
            <>
              <img
                src={
                  receivingCombinedDetails.currentImage ||
                  receivingCombinedDetails.pokemon_image_url
                }
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

      {/* New "Reveal Info" section */}
      <div className="reveal-partner-info">
        {!partnerInfo && !revealInProgress && (
          <button onClick={handleRevealInfo}>Reveal Partner Info</button>
        )}
        {revealInProgress && <p>Revealing info...</p>}
        {partnerInfo && (
          <div className="partner-info">
            <p><strong>Partner's Trainer Code:</strong> {partnerInfo.trainerCode}</p>
            <p><strong>Partner's Pokémon GO Name:</strong> {partnerInfo.pokemonGoName}</p>
          </div>
        )}
        {error && <p className="error">{error}</p>}
      </div>

      <div className="trade-actions">
        <button onClick={handleComplete}>Complete</button>
        <button onClick={handleCancel}>Cancel</button>
      </div>
    </div>
  );
};

export default PendingTradeView;
