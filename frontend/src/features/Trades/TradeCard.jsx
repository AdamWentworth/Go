// TradeCard.jsx
import React from 'react';
import { usePokemonData } from '../../contexts/PokemonDataContext';
import { useTradeData } from '../../contexts/TradeDataContext';
import { useOfferingDetails } from './hooks/useOfferingDetails';
import { useReceivingDetails } from './hooks/useReceivingDetails';
import ProposedTradeView from './views/ProposedTradeView';
import OffersTradeView from './views/OffersTradeView';
import PendingTradeView from './views/PendingTradeView';
import { handleAcceptTrade } from './handlers/handleAcceptTrade';
import './TradeCard.css';

function TradeCard({ trade, relatedInstances, selectedStatus }) {
  const { variants, ownershipData, loading, periodicUpdates } = usePokemonData();
  const { setTradeData, trades } = useTradeData();

  const offeringDetails = useOfferingDetails(trade, variants, ownershipData);
  const receivingCombinedDetails = useReceivingDetails(trade, variants, relatedInstances);

  // Use the imported utility function for handleAccept
  const handleAccept = async () => {
    await handleAcceptTrade({ trade, trades, setTradeData, periodicUpdates });
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

  return (
    <div className="trade-card">
      {/* Default or other status rendering logic */}
    </div>
  );
}

export default TradeCard;
