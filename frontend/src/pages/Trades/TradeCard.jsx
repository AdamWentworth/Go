// TradeCard.jsx

import React from 'react';
import { useTradeStore } from '@/features/trades/store/useTradeStore';
import { useModal } from '../../contexts/ModalContext.jsx'; // Import the useModal hook

// hooks
import { usePokemonDetails } from './hooks/usePokemonDetails';

// views
import ProposedTradeView from './views/ProposedTradeView.jsx';
import OffersTradeView from './views/OffersTradeView.jsx';
import PendingTradeView from './views/PendingTradeView.jsx';
import CancelledTradeView from './views/CancelledTradeView.jsx';
import CompletedTradeView from './views/CompletedTradeView.jsx';

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
  const setTradeData = useTradeStore((s) => s.setTradeData);
  const trades = useTradeStore((s) => s.trades);
  const { confirm } = useModal(); // Destructure confirm from useModal

  // Grab the current user's username from local storage.
  const storedUser = localStorage.getItem('user');
  const currentUsername = storedUser ? JSON.parse(storedUser).username : '';

  // -- 1. Determine which side the current user is on (Proposer or Accepter) --
  const isCurrentUserProposer = trade.username_proposed === currentUsername;
  const isCurrentUserAccepter = trade.username_accepting === currentUsername;

  // This can be helpful for clarity if you need them:
  const currentUserName = isCurrentUserProposer
    ? trade.username_proposed
    : trade.username_accepting;

  const partnerName = isCurrentUserProposer
    ? trade.username_accepting
    : trade.username_proposed;

  // -- 2. Derive the correct Pokémon instance IDs for the current user vs. the partner --
  // Here we pass the actual ID directly
  const currentUserInstanceId = isCurrentUserProposer
    ? trade.pokemon_instance_id_user_proposed
    : trade.pokemon_instance_id_user_accepting;

  const partnerInstanceId = isCurrentUserProposer
    ? trade.pokemon_instance_id_user_accepting
    : trade.pokemon_instance_id_user_proposed;

  // Because the hook now expects the raw instance ID:
  const currentUserDetails = usePokemonDetails(
    currentUserInstanceId,
    variants,
    relatedInstances,
    ownershipData
  );

  const partnerDetails = usePokemonDetails(
    partnerInstanceId,
    variants,
    relatedInstances,
    ownershipData
  );

  // -- 4. Handlers for various trade actions with confirmation --
  const handleAccept = async () => {
    const isConfirmed = await confirm('Are you sure you want to accept this trade?');
    if (isConfirmed) {
      await handleAcceptTrade({ trade, trades, setTradeData, periodicUpdates });
    }
  };

  const handleDeny = async () => {
    const isConfirmed = await confirm('Are you sure you want to deny this trade?');
    if (isConfirmed) {
      await handleDenyTrade({ trade, trades, setTradeData, periodicUpdates });
    }
  };

  const handleDelete = async () => {
    const isConfirmed = await confirm('Are you sure you want to delete this trade?');
    if (isConfirmed) {
      await handleDeleteTrade({ trade, trades, setTradeData, periodicUpdates });
    }
  };

  const handleComplete = async () => {
    const isConfirmed = await confirm('Are you sure you want to complete this trade?');
    if (isConfirmed) {
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
    }
  };

  const handleCancel = async () => {
    const isConfirmed = await confirm('Are you sure you want to cancel this trade?');
    if (isConfirmed) {
      await handleCancelTrade({ trade, trades, setTradeData, periodicUpdates, currentUsername });
    }
  };

  const handleRePropose = async () => {
    const isConfirmed = await confirm('Are you sure you want to re-propose this trade?');
    if (isConfirmed) {
      await handleReProposeTrade({ trade, trades, setTradeData, periodicUpdates, currentUsername });
    }
  };

  const handleThumbsUp = async () => {
    await handleThumbsUpTrade({ trade, trades, setTradeData, periodicUpdates, currentUsername });
  };

  // -- 5. Determine headings (depending on selectedStatus) --
  //     (You can further rename these as you see fit.)
  const isProposed = selectedStatus.toLowerCase() === 'proposed';
  const offeringHeading = isProposed ? 'Offered:' : 'Offering:';
  const receivingHeading = isProposed ? 'For Trade:' : 'Receiving:';

  // -- 6. Render conditionally based on status --
  if (selectedStatus.toLowerCase() === 'accepting') {
    return (
      <OffersTradeView
        trade={trade}
        currentUsername={currentUsername}
        currentUserDetails={currentUserDetails}
        partnerDetails={partnerDetails}
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
        currentUserDetails={currentUserDetails}
        partnerDetails={partnerDetails}
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
        currentUserDetails={currentUserDetails}
        partnerDetails={partnerDetails}
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
        currentUserDetails={currentUserDetails}
        partnerDetails={partnerDetails}
        loading={loading}
        handleRePropose={handleRePropose}
      />
    );
  }

  if (selectedStatus.toLowerCase() === 'completed') {
    return (
      <CompletedTradeView
        trade={trade}
        currentUserDetails={currentUserDetails}
        partnerDetails={partnerDetails}
        loading={loading}
        handleThumbsUp={handleThumbsUp}
      />
    );
  }

  // -- 7. Default fallback (if any other status) --
  return (
    <div className="trade-card">
      {/* You could display something or return null */}
      Unknown trade status: {selectedStatus}
    </div>
  );
}

export default TradeCard;
