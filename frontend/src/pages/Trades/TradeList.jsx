// TradeList.jsx

import React, { useEffect } from 'react';
import './TradeList.css';
import TradeCard from './TradeCard';

function TradeList({
  trades,
  relatedInstances,
  selectedStatus,
  // New props from Trades.jsx
  setOwnershipData,
  variants,
  ownershipData,
  loading,
  periodicUpdates
}) {
  const storedUser = localStorage.getItem('user');
  const currentUsername = storedUser ? JSON.parse(storedUser).username : null;

  const sortedTrades = Object.entries(trades)
    .map(([trade_id, trade]) => ({ ...trade, trade_id }))
    .sort((a, b) => {
      const statusA = a.trade_status || '';
      const statusB = b.trade_status || '';
      return statusA.localeCompare(statusB);
    });

  let filteredTrades = [];

  if (selectedStatus.toLowerCase() === 'proposed') {
    filteredTrades = sortedTrades.filter(
      (trade) =>
        (trade.trade_status || '').toLowerCase() === 'proposed' &&
        trade.username_proposed === currentUsername
    );
  } else if (selectedStatus.toLowerCase() === 'accepting') {
    filteredTrades = sortedTrades.filter(
      (trade) =>
        (trade.trade_status || '').toLowerCase() === 'proposed' &&
        trade.username_accepting === currentUsername
    );
  } else {
    filteredTrades = sortedTrades.filter(
      (trade) => (trade.trade_status || '').toLowerCase() === selectedStatus.toLowerCase()
    );
  }

  useEffect(() => {
    // console.log('[TradeList] Trades:', sortedTrades);
    // console.log('[TradeList] Related Instances:', relatedInstances);
  }, [sortedTrades, relatedInstances]);

  return (
    <div className="trades-list">
      {filteredTrades.length === 0 ? (
        <p>No trades found for status: {selectedStatus}</p>
      ) : (
        filteredTrades.map((trade, index) => (
          <TradeCard 
            key={trade.trade_id ? `${trade.trade_id}_${index}` : `trade_${index}`}
            trade={trade}
            relatedInstances={relatedInstances}
            selectedStatus={selectedStatus}
            // Pass these props down to TradeCard
            setOwnershipData={setOwnershipData}
            variants={variants}
            ownershipData={ownershipData}
            loading={loading}
            periodicUpdates={periodicUpdates}
          />
        ))
      )}
    </div>
  );
}

export default TradeList;
