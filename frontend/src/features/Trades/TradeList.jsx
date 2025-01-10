// TradeList.jsx

import React, { useEffect } from 'react';

function TradeList({ trades, relatedInstances, selectedStatus }) {
  // Convert trades object to array, sort by trade_status, then filter by selectedStatus
  const sortedTrades = Object.values(trades).sort((a, b) =>
    a.trade_status.localeCompare(b.trade_status)
  );

  const filteredTrades = sortedTrades.filter(
    (trade) => trade.trade_status.toLowerCase() === selectedStatus.toLowerCase()
  );

  // Log trades and relatedInstances whenever they change
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
          <div key={trade.trade_id} className="trade-card">
            <p><strong>Trade ID:</strong> {trade.trade_id}</p>
            <p><strong>Status:</strong> {trade.trade_status}</p>
            {/* Add other trade details here as needed */}
          </div>
        ))
      )}
    </div>
  );
}

export default TradeList;
