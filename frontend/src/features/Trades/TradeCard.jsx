// TradeCard.jsx
import React from 'react';
import { usePokemonData } from '../../contexts/PokemonDataContext';
import { useTradeData } from '../../contexts/TradeDataContext';
import { useOfferingDetails } from './hooks/useOfferingDetails';
import { useReceivingDetails } from './hooks/useReceivingDetails';
import ProposedTradeView from './views/ProposedTradeView';
import OffersTradeView from './views/OffersTradeView';
import PendingTradeView from './views/PendingTradeView';
import { putBatchedTradeUpdates } from '../../services/indexedDB';
import './TradeCard.css';

function TradeCard({ trade, relatedInstances, selectedStatus }) {
  const { variants, ownershipData, loading, periodicUpdates } = usePokemonData();
  const { setTradeData, trades } = useTradeData();

  const offeringDetails = useOfferingDetails(trade, variants, ownershipData);
  const receivingCombinedDetails = useReceivingDetails(trade, variants, relatedInstances);

  // Define handleAccept function for OffersTradeView
  const handleAccept = async () => {
    // Create an updated trade object with accepted date and new status
    const updatedTrade = {
      ...trade,
      trade_accepted_date: new Date().toISOString(), // Set accepted date to current time
      trade_status: 'pending'                      // Update status to 'pending'
    };

    // Update the trades collection with the modified trade
    const updatedTrades = { ...trades, [trade.trade_id]: updatedTrade };

    // Persist the updated trades data using setTradeData
    await setTradeData(updatedTrades);

    // Prepare batched update data
    const batchedUpdateData = {
      operation: 'updateTrade',
      tradeData: updatedTrade,
    };

    // Use the same trade_id as the key to identify uniquely
    await putBatchedTradeUpdates(updatedTrade.trade_id, batchedUpdateData);

    // Call periodicUpdates to refresh data as needed
    periodicUpdates();
  };

  const handleDelete = () => { /*...*/ };
  const handleComplete = () => { /*...*/ };
  const handleCancel = () => { /*...*/ };
  const handleThumbsUp = () => { /*...*/ };

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
        handleDelete={handleDelete}
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

  // Fallback rendering for other statuses or default layout
  return (
    <div className="trade-card">
      {/* Default or other status rendering logic */}
    </div>
  );
}

export default TradeCard;
