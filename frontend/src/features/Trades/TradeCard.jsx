// TradeCard.jsx
import React from 'react';
import { usePokemonData } from '../../contexts/PokemonDataContext';
import { useOfferingDetails } from './hooks/useOfferingDetails';
import { useReceivingDetails } from './hooks/useReceivingDetails';
import ProposedTradeView from './views/ProposedTradeView';
import AcceptingTradeView from './views/AcceptingTradeView';
import './TradeCard.css';

function TradeCard({ trade, relatedInstances, selectedStatus }) {
  const { variants, ownershipData, loading } = usePokemonData();

  const offeringDetails = useOfferingDetails(trade, variants, ownershipData);
  const receivingCombinedDetails = useReceivingDetails(trade, variants, relatedInstances);

  // Placeholder functions for actions
  const handleAccept = () => { /* Accept function logic */ };
  const handleDelete = () => { /* Delete function logic */ };
  const handleComplete = () => { /* Complete function logic */ };
  const handleCancel = () => { /* Cancel function logic */ };
  const handleThumbsUp = () => { /* Thumbs up function logic */ };

  // Retrieve current username from local storage
  const storedUser = localStorage.getItem('user');
  const currentUsername = storedUser ? JSON.parse(storedUser).username : '';

  const isProposed = selectedStatus.toLowerCase() === 'proposed';
  const offeringHeading = isProposed ? 'Offered:' : 'Offering:';
  const receivingHeading = isProposed ? 'For Trade:' : 'Receiving:';

  if (selectedStatus.toLowerCase() === 'accepting') {
    return (
      <AcceptingTradeView
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

  // Fallback rendering for other statuses or default layout
  // (You can modularize other statuses similarly if needed)
  return (
    <div className="trade-card">
      {/* Default or other status rendering logic */}
    </div>
  );
}

export default TradeCard;
