// TradeList.jsx
import React, { useEffect } from 'react';
import './TradeList.css';
import TradeCard from './TradeCard';

function TradeList({ trades, relatedInstances, selectedStatus }) {
  const storedUser = localStorage.getItem('user');
  const currentUsername = storedUser ? JSON.parse(storedUser).username : null;

  const sortedTrades = Object.values(trades).sort((a, b) =>
    a.trade_status.localeCompare(b.trade_status)
  );

  let filteredTrades = [];

  if (selectedStatus.toLowerCase() === 'proposed') {
    filteredTrades = sortedTrades.filter(
      (trade) =>
        trade.trade_status.toLowerCase() === 'proposed' &&
        trade.username_proposed === currentUsername
    );
  } else if (selectedStatus.toLowerCase() === 'accepting') {
    filteredTrades = sortedTrades.filter(
      (trade) =>
        trade.trade_status.toLowerCase() === 'proposed' &&
        trade.username_accepting === currentUsername
    );
  } else {
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
        filteredTrades.map((trade, index) => (
          <TradeCard 
            key={ trade.trade_id ? `${trade.trade_id}_${index}` : `trade_${index}` }
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
