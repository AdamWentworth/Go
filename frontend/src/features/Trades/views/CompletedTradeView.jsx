// CompletedTradeView.jsx
import React from 'react';
import LoadingSpinner from '../../../components/LoadingSpinner';
import './CompletedTradeView.css';

const CompletedTradeView = ({
  trade,
  offeringDetails,
  receivingCombinedDetails,
  loading,
  handleThumbsUp
}) => {
  const storedUser = localStorage.getItem('user');
  const currentUsername = storedUser ? JSON.parse(storedUser).username : '';

  // Determine which side the current user was on
  const isCurrentUserProposer = (trade.username_proposed === currentUsername);

  // Determine satisfaction status for the current user
  const satisfactionStatus = isCurrentUserProposer
    ? trade.user_1_trade_satisfaction
    : trade.user_2_trade_satisfaction;

  // **Adjusted Content Assignment:**
  // Left side always shows "Received Pokémon"
  // Right side always shows "Traded Pokémon"
  const leftDetails = receivingCombinedDetails;
  const rightDetails = offeringDetails;

  // For usernames:
  // Left side: partner who provided the received Pokémon
  // Right side: current user who traded the Pokémon
  const leftUsername = currentUsername;
  const rightUsername = isCurrentUserProposer ? trade.username_accepting : trade.username_proposed;

  // Headers remain static as specified
  const leftHeading = 'Received Pokémon';
  const rightHeading = 'Traded Pokémon';

  return (
    <div className="trade-card completed-trade-view">
      <h2>Trade Completed</h2>

      {trade.trade_completed_date && (
        <p>Completed on: {new Date(trade.trade_completed_date).toLocaleString()}</p>
      )}

      <div className="trade-pokemon">
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

        <div className="center-column">
          <div className="trade-icon">
            <img src="/images/pogo_trade_icon.png" alt="Trade Icon" />
          </div>
        </div>

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

      {/* Thumbs Up Button with conditional styling */}
      <div className="trade-actions">
        {/* Conditional text based on satisfactionStatus */}
        <p className="trade-feedback-text">
          {satisfactionStatus ? "Thanks for the feedback!" : "Satisfied with your trade?"}
        </p>

        <button
          className={`thumbs-up-button ${satisfactionStatus ? 'active' : ''}`}
          onClick={handleThumbsUp}
        >
          👍
        </button>
      </div>
    </div>
  );
};

export default CompletedTradeView;
