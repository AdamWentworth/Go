// TradeList.jsx

import React, { useEffect } from 'react';
import './TradeList.css';  // Import CSS for styling
import TradeCard from './TradeCard';  // Import the TradeCard component

function TradeList({ trades, relatedInstances, selectedStatus }) {
  // Convert trades object to array, sort by trade_status, then filter by selectedStatus
  const sortedTrades = Object.values(trades).sort((a, b) =>
    a.trade_status.localeCompare(b.trade_status)
  );

  const filteredTrades = sortedTrades.filter(
    (trade) => trade.trade_status.toLowerCase() === selectedStatus.toLowerCase()
  );

  useEffect(() => {
    console.log('Trades:', trades);
    console.log('Related Instances:', relatedInstances);
  }, [trades, relatedInstances]);

  return (
    <div className="trades-list">
      {filteredTrades.length === 0 ? (
        <p>No trades found for status: {selectedStatus}</p>
      ) : (
        filteredTrades.map((trade) => (
          <TradeCard 
            key={trade.trade_id} 
            trade={trade} 
            relatedInstances={relatedInstances} 
          />
        ))
      )}
    </div>
  );
}

export default TradeList;
