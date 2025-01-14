// PendingTradeView.jsx
import React, { useState } from 'react';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { revealPartnerInfo } from '../../../services/tradeService';
import PartnerInfoModal from '../components/PartnerInfoModal';
import './PendingTradeView.css';  // Ensure this CSS is imported

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
      const data = await revealPartnerInfo(trade);
      setPartnerInfo(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setRevealInProgress(false);
    }
  };

  const handleCloseModal = () => {
    setPartnerInfo(null);
    setError(null);
  };

  return (
    <div className="trade-card pending-trade-view">
      <div className="trade-pokemon">
        {/* Offering Section */}
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

        {/* Center Column: Reveal Button above Trade Icon */}
        <div className="center-column">
          <div className="reveal-partner-info">
          <button
            className="reveal-partner-button"
            onClick={handleRevealInfo}
            disabled={revealInProgress}
          >
            <span>Reveal Partner Info</span>
          </button>
            {error && <p className="error">{error}</p>}
          </div>
          <div className="trade-icon">
            <img src="/images/pogo_trade_icon.png" alt="Trade Icon" />
          </div>
        </div>

        {/* Receiving Section */}
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

      <div className="trade-actions">
        <button className="complete-button" onClick={handleComplete}>Complete</button>
        <button className="cancel-button" onClick={handleCancel}>Cancel</button>
      </div>
      
      <PartnerInfoModal
        partnerInfo={partnerInfo}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default PendingTradeView;

