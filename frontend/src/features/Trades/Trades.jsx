// Trades.jsx

import React, { useState } from 'react';
import { useTradeData } from '../../contexts/TradeDataContext';
import TradeStatusButtons from './TradeStatusButtons';  
import TradeList from './TradeList';  // Import the new component
import './TradeStatusButtons.css';

function Trades() {
  const { trades, relatedInstances } = useTradeData();  
  const [selectedStatus, setSelectedStatus] = useState('Pending');

  return (
    <div className="trades-container">
      <TradeStatusButtons 
        selectedStatus={selectedStatus} 
        setSelectedStatus={setSelectedStatus} 
      />

      {/* Use the new TradeList component */}
      <TradeList 
        trades={trades} 
        relatedInstances={relatedInstances} 
        selectedStatus={selectedStatus} 
      />
    </div>
  );
}

export default Trades;