// TradeSearch.jsx
// TradeSearch.jsx

import React from 'react';
import './TradeSearch.css'; // Import the specific CSS for TradeSearch

const TradeSearch = ({ onlyMatchingTrades, setOnlyMatchingTrades }) => {
  return (
    <div className="trade-search-options">
      <div className="field">
        <input
          type="checkbox"
          checked={onlyMatchingTrades}
          onChange={(e) => setOnlyMatchingTrades(e.target.checked)}
        />
        <label>
          Include Only Results Who Want a Pokémon in Your Trade List
        </label>
      </div>
    </div>
  );
};

export default TradeSearch;
