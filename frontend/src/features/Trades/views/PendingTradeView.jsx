// PendingTradeView.jsx

import React, { useState } from 'react';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { revealPartnerInfo } from '../../../services/tradeService';
import PartnerInfoModal from '../components/PartnerInfoModal';
import './PendingTradeView.css';

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

  const storedUser = localStorage.getItem('user');
  const currentUsername = storedUser ? JSON.parse(storedUser).username : '';

  // Decide who is on the left vs. right
  const isCurrentUserProposer = (trade.username_proposed === currentUsername);

  const leftDetails = isCurrentUserProposer ? offeringDetails : receivingCombinedDetails;
  const rightDetails = isCurrentUserProposer ? receivingCombinedDetails : offeringDetails;

  // Usernames for display
  const leftUsername = isCurrentUserProposer ? trade.username_proposed : trade.username_accepting;
  const rightUsername = isCurrentUserProposer ? trade.username_accepting : trade.username_proposed;

  // Headings (optional - adjust as desired)
  const leftHeading = 'Your Pokémon';
  const rightHeading = 'Trade Partner’s Pokémon';

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
        {/* Left Side (Current User) */}
        <div className="pokemon left-side">
          <p className="receiving-username">{leftUsername}</p>
          <h4>{leftHeading}</h4>
          {leftDetails ? (
            <>
              <img
                src={leftDetails.currentImage || leftDetails.pokemon_image_url}
                alt={leftDetails.name || 'Your Pokémon'}
              />
              <p>{leftDetails.name || leftDetails.pokemon_name}</p>
            </>
          ) : loading ? (
            <LoadingSpinner />
          ) : (
            <p>Could not load details.</p>
          )}
        </div>

        {/* Center Column: Reveal Partner Button */}
        <div className="center-column">
          <div className="reveal-partner-info">
            <button
              className="reveal-partner-button"
              onClick={handleRevealInfo}
              disabled={revealInProgress}
            >
              <span>Reveal Trade Partner Info</span>
            </button>
            {error && <p className="error">{error}</p>}
          </div>
          <div className="trade-icon">
            <img src="/images/pogo_trade_icon.png" alt="Trade Icon" />
          </div>
        </div>

        {/* Right Side (Other User) */}
        <div className="pokemon right-side">
          <p className="receiving-username">{rightUsername}</p>
          <h4>{rightHeading}</h4>
          {rightDetails ? (
            <>
              <img
                src={rightDetails.currentImage || rightDetails.pokemon_image_url}
                alt={rightDetails.name || 'Partner’s Pokémon'}
              />
              <p>{rightDetails.name || rightDetails.pokemon_name}</p>
            </>
          ) : loading ? (
            <LoadingSpinner />
          ) : (
            <p>Could not load details.</p>
          )}
        </div>
      </div>

      <div className="trade-actions">
        <button className="complete-button" onClick={handleComplete}>
          Complete
        </button>
        <button className="cancel-button" onClick={handleCancel}>
          Cancel
        </button>
      </div>

      <PartnerInfoModal
        partnerInfo={partnerInfo}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default PendingTradeView;
