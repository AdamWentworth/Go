// CancelledTradeView.jsx
import React from 'react';
import LoadingSpinner from '../../../components/LoadingSpinner';
import './CancelledTradeView.css';

const CancelledTradeView = ({
  trade,
  offeringDetails,
  receivingCombinedDetails,
  loading
}) => {
  const storedUser = localStorage.getItem('user');
  const currentUsername = storedUser ? JSON.parse(storedUser).username : '';

  // Determine who is the proposer vs. acceptor
  const isCurrentUserProposer = (trade.username_proposed === currentUsername);

  // Left is the current user’s side, right is the partner’s side
  const leftDetails = isCurrentUserProposer ? offeringDetails : receivingCombinedDetails;
  const rightDetails = isCurrentUserProposer ? receivingCombinedDetails : offeringDetails;

  // Display names
  const leftUsername = isCurrentUserProposer ? trade.username_proposed : trade.username_accepting;
  const rightUsername = isCurrentUserProposer ? trade.username_accepting : trade.username_proposed;

  // Headings for clarity
  const leftHeading = 'Your Pokémon';
  const rightHeading = 'Trade Partner’s Pokémon';

  return (
    <div className="trade-card cancelled-trade-view">
      <h2>Trade Cancelled</h2>

      {trade.trade_cancelled_date && (
        <p>Cancelled on: {new Date(trade.trade_cancelled_date).toLocaleString()}</p>
      )}

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

        <div className="center-column">
          <div className="trade-icon">
            <img src="/images/pogo_trade_icon.png" alt="Trade Icon" />
          </div>
        </div>

        {/* Right Side (Trade Partner) */}
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
    </div>
  );
};

export default CancelledTradeView;
