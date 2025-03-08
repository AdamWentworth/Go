// Trades.jsx

import React, { useState } from 'react';
import { useTradeData } from '../../contexts/TradeDataContext';
import { usePokemonData } from '../../contexts/PokemonDataContext';
import TradeStatusButtons from './TradeStatusButtons';  
import TradeList from './TradeList';  
import './TradeStatusButtons.css';
import ActionMenu from '../../components/ActionMenu'; // Import the ActionMenu component

function Trades() {
  const { trades, relatedInstances } = useTradeData();  
  const [selectedStatus, setSelectedStatus] = useState('Pending');

  // Call usePokemonData here
  const {
    setOwnershipData,
    variants,
    ownershipData,
    loading,
    periodicUpdates
  } = usePokemonData();

  return (
    <div className="trades-container">
      <TradeStatusButtons 
        selectedStatus={selectedStatus} 
        setSelectedStatus={setSelectedStatus} 
      />

      <TradeList 
        trades={trades} 
        relatedInstances={relatedInstances} 
        selectedStatus={selectedStatus} 
        // Pass down the Pokémon data props
        setOwnershipData={setOwnershipData}
        variants={variants}
        ownershipData={ownershipData}
        loading={loading}
        periodicUpdates={periodicUpdates}
      />

      {/* Render the ActionMenu component */}
      <ActionMenu />
    </div>
  );
}

export default Trades;