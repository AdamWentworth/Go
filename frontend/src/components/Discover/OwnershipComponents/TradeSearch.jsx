// TradeSearch.jsx
import React from 'react';

const TradeSearch = ({ onlyMatchingTrades, setOnlyMatchingTrades }) => {
  return (
    <div className="trade-options">
      <div className="field">
        <label>
          Include Only Matches who want a Pokémon in your Trade List
        </label>
        <input
          type="checkbox"
          checked={onlyMatchingTrades}
          onChange={(e) => setOnlyMatchingTrades(e.target.checked)}
        />
      </div>
    </div>
  );
};

export default TradeSearch;
