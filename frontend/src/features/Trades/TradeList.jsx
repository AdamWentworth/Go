// TradeList.jsx
import React, { useEffect } from 'react';
import './TradeList.css';
import TradeCard from './TradeCard';

function TradeList({ trades, relatedInstances, selectedStatus }) {
  // Retrieve current username from local storage (adjust as needed for your app)
  const storedUser = localStorage.getItem('user');
  const currentUsername = storedUser ? JSON.parse(storedUser).username : null;

  // Convert trades object to array and sort by trade_status
  const sortedTrades = Object.values(trades).sort((a, b) =>
    a.trade_status.localeCompare(b.trade_status)
  );

  let filteredTrades = [];

  if (selectedStatus.toLowerCase() === 'proposed') {
    // Filter trades where current user is the proposer
    filteredTrades = sortedTrades.filter(
      (trade) =>
        trade.trade_status.toLowerCase() === 'proposed' &&
        trade.username_proposed === currentUsername
    );
  } else if (selectedStatus.toLowerCase() === 'accepting') {
    // Filter trades where current user is the accepter
    filteredTrades = sortedTrades.filter(
      (trade) =>
        trade.trade_status.toLowerCase() === 'proposed' &&
        trade.username_accepting === currentUsername
    );
  } else {
    // For other statuses, a straightforward filter
    filteredTrades = sortedTrades.filter(
      (trade) => trade.trade_status.toLowerCase() === selectedStatus.toLowerCase()
    );
  }

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
            key={ trade.trade_id }
            trade={trade} 
            relatedInstances={relatedInstances}
            selectedStatus={selectedStatus}
          />
        ))
      )}
    </div>
  );  
}

export default TradeList;
