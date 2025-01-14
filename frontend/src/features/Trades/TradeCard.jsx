// TradeCard.jsx
import React from 'react';
import { usePokemonData } from '../../contexts/PokemonDataContext';
import { useTradeData } from '../../contexts/TradeDataContext';
//hooks
import { useOfferingDetails } from './hooks/useOfferingDetails';
import { useReceivingDetails } from './hooks/useReceivingDetails';
//views
import ProposedTradeView from './views/ProposedTradeView';
import OffersTradeView from './views/OffersTradeView';
import PendingTradeView from './views/PendingTradeView';
import CancelledTradeView from './views/CancelledTradeView';
import CompletedTradeView from './views/CompletedTradeView'
//handlers
import { handleAcceptTrade } from './handlers/handleAcceptTrade';
import { handleDenyTrade } from './handlers/handleDenyTrade';
import { handleDeleteTrade } from './handlers/handleDeleteTrade';
import { handleCancelTrade } from './handlers/handleCancelTrade';
import { handleReProposeTrade } from './handlers/handleReProposeTrade';
import { handleCompleteTrade } from './handlers/handleCompleteTrade';
import { handleThumbsUpTrade } from './handlers/handleThumbsUpTrade'
import './TradeCard.css';

function TradeCard({ trade, relatedInstances, selectedStatus }) {
  const { setOwnershipData, variants, ownershipData, loading, periodicUpdates } = usePokemonData();
  const { setTradeData, trades } = useTradeData();

  const offeringDetails = useOfferingDetails(trade, variants, ownershipData);
  const receivingCombinedDetails = useReceivingDetails(trade, variants, relatedInstances);

  // Use the imported utility function for handleAccept
  const handleAccept = async () => {
    await handleAcceptTrade({ trade, trades, setTradeData, periodicUpdates });
  };

  const handleDeny = async () => {
    await handleDenyTrade({ trade, trades, setTradeData, periodicUpdates });
  };

  const handleDelete = async () => {
    await handleDeleteTrade({ trade, trades, setTradeData, periodicUpdates });
  };
  const handleComplete = async () => {
    await handleCompleteTrade({ trade, trades, setTradeData, periodicUpdates, relatedInstances, ownershipData, setOwnershipData });
  };

  const handleCancel = async () => {
    await handleCancelTrade({ trade, trades, setTradeData, periodicUpdates, currentUsername });
  };

  const handleRePropose = async () => {
    await handleReProposeTrade({ trade, trades, setTradeData, periodicUpdates, currentUsername });
  };

  const handleThumbsUp = async () => {
    await handleThumbsUpTrade({ trade, trades, setTradeData, periodicUpdates, currentUsername });
  };

  const storedUser = localStorage.getItem('user');
  const currentUsername = storedUser ? JSON.parse(storedUser).username : '';

  const isProposed = selectedStatus.toLowerCase() === 'proposed';
  const offeringHeading = isProposed ? 'Offered:' : 'Offering:';
  const receivingHeading = isProposed ? 'For Trade:' : 'Receiving:';

  if (selectedStatus.toLowerCase() === 'accepting') {
    return (
      <OffersTradeView
        trade={trade}
        currentUsername={currentUsername}
        offeringDetails={offeringDetails}
        receivingCombinedDetails={receivingCombinedDetails}
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
        offeringDetails={offeringDetails}
        receivingCombinedDetails={receivingCombinedDetails}
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
        offeringDetails={offeringDetails}
        receivingCombinedDetails={receivingCombinedDetails}
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
        offeringDetails={offeringDetails}
        receivingCombinedDetails={receivingCombinedDetails}
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

  return (
    <div className="trade-card">
      {/* Default or other status rendering logic */}
    </div>
  );
}

export default TradeCard;
