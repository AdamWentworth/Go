// TradeCard.jsx

import React from 'react';
import { useTradeData } from '../../contexts/TradeDataContext';
// hooks
import { usePokemonDetails } from './hooks/usePokemonDetails';

// views
import ProposedTradeView from './views/ProposedTradeView';
import OffersTradeView from './views/OffersTradeView';
import PendingTradeView from './views/PendingTradeView';
import CancelledTradeView from './views/CancelledTradeView';
import CompletedTradeView from './views/CompletedTradeView';

// handlers
import { handleAcceptTrade } from './handlers/handleAcceptTrade';
import { handleDenyTrade } from './handlers/handleDenyTrade';
import { handleDeleteTrade } from './handlers/handleDeleteTrade';
import { handleCancelTrade } from './handlers/handleCancelTrade';
import { handleReProposeTrade } from './handlers/handleReProposeTrade';
import { handleCompleteTrade } from './handlers/handleCompleteTrade';
import { handleThumbsUpTrade } from './handlers/handleThumbsUpTrade';

import './TradeCard.css';

function TradeCard({
  trade,
  relatedInstances,
  selectedStatus,
  setOwnershipData,
  variants,
  ownershipData,
  loading,
  periodicUpdates
}) {
  const { setTradeData, trades } = useTradeData();

  const storedUser = localStorage.getItem('user');
  const currentUsername = storedUser ? JSON.parse(storedUser).username : '';

  // Determine user role early
  const isCurrentUserProposer = trade.username_proposed === currentUsername;

  // Dynamic details for pending view
  const currentUserInstanceId = isCurrentUserProposer
    ? 'pokemon_instance_id_user_proposed'
    : 'pokemon_instance_id_user_accepting';

  const partnerInstanceId = isCurrentUserProposer
    ? 'pokemon_instance_id_user_accepting'
    : 'pokemon_instance_id_user_proposed';

  // Always use ownership data for current user's Pokémon
  const currentUserDetails = usePokemonDetails(
    trade,
    currentUserInstanceId,
    variants,
    null,
    ownershipData
  );

  // Always use related instances for partner's Pokémon
  const partnerDetails = usePokemonDetails(
    trade,
    partnerInstanceId,
    variants,
    relatedInstances,
    null
  );

  // Accepting or Denying the trade
  const handleAccept = async () => {
    await handleAcceptTrade({ trade, trades, setTradeData, periodicUpdates });
  };
  const handleDeny = async () => {
    await handleDenyTrade({ trade, trades, setTradeData, periodicUpdates });
  };

  // Deleting or Completing the trade
  const handleDelete = async () => {
    await handleDeleteTrade({ trade, trades, setTradeData, periodicUpdates });
  };
  const handleComplete = async () => {
    await handleCompleteTrade({
      trade,
      trades,
      setTradeData,
      periodicUpdates,
      relatedInstances,
      ownershipData,
      setOwnershipData,
      currentUsername
    });
  };

  // Cancelling / Re-Proposing / Thumbs Up
  const handleCancel = async () => {
    await handleCancelTrade({ trade, trades, setTradeData, periodicUpdates, currentUsername });
  };
  const handleRePropose = async () => {
    await handleReProposeTrade({ trade, trades, setTradeData, periodicUpdates, currentUsername });
  };
  const handleThumbsUp = async () => {
    await handleThumbsUpTrade({ trade, trades, setTradeData, periodicUpdates, currentUsername });
  };

  // Determine headings (depending on selectedStatus)
  const isProposed = selectedStatus.toLowerCase() === 'proposed';
  const offeringHeading = isProposed ? 'Offered:' : 'Offering:';
  const receivingHeading = isProposed ? 'For Trade:' : 'Receiving:';

  // Render conditionally based on selectedStatus
  if (selectedStatus.toLowerCase() === 'accepting') {
    return (
      <OffersTradeView
        trade={trade}
        currentUsername={currentUsername}
        forTradeDetails={currentUserDetails}
        offeredDetails={partnerDetails}
        loading={loading}
        handleAccept={handleAccept}
        handleDeny={handleDeny}
      />
    );
  }

  if (selectedStatus.toLowerCase() === 'proposed') {
    return (
      <ProposedTradeView
        trade={trade}
        offeringDetails={currentUserDetails}
        receivingCombinedDetails={partnerDetails}
        loading={loading}
        offeringHeading={offeringHeading}
        receivingHeading={receivingHeading}
        handleDelete={handleDelete}
      />
    );
  }

  if (selectedStatus.toLowerCase() === 'pending') {
    return (
      <PendingTradeView
        trade={trade}
        offeringDetails={currentUserDetails}
        receivingCombinedDetails={partnerDetails}
        loading={loading}
        handleComplete={handleComplete}
        handleCancel={handleCancel}
      />
    );
  }

  if (selectedStatus.toLowerCase() === 'cancelled') {
    return (
      <CancelledTradeView
        trade={trade}
        offeringDetails={currentUserDetails}
        receivingCombinedDetails={partnerDetails}
        loading={loading}
        handleRePropose={handleRePropose}
      />
    );
  }

  if (selectedStatus.toLowerCase() === 'completed') {
    return (
      <CompletedTradeView
        trade={trade}
        offeringDetails={offeringDetails}
        receivingCombinedDetails={receivingCombinedDetails}
        loading={loading}
        handleThumbsUp={handleThumbsUp}
      />
    );
  }

  // Default fallback (if any other status)
  return (
    <div className="trade-card">
      {/* Render something if desired */}
    </div>
  );
}

export default TradeCard;
