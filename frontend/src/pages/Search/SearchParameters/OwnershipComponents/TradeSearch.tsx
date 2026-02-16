import React from 'react';

import './TradeSearch.css';

type TradeSearchProps = {
  onlyMatchingTrades: boolean;
  setOnlyMatchingTrades: React.Dispatch<React.SetStateAction<boolean>>;
};

const TradeSearch: React.FC<TradeSearchProps> = ({
  onlyMatchingTrades,
  setOnlyMatchingTrades,
}) => {
  return (
    <div className="trade-search-options">
      <div className="field">
        <input
          type="checkbox"
          checked={onlyMatchingTrades}
          onChange={(event) => setOnlyMatchingTrades(event.target.checked)}
        />
        <label>Include only results who want a Pokemon in your trade list</label>
      </div>
    </div>
  );
};

export default TradeSearch;
