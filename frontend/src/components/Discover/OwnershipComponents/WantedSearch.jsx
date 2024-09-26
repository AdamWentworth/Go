// WantedSearch.jsx
import React from 'react';

const WantedSearch = ({ prefLucky, setPrefLucky, alreadyRegistered, setAlreadyRegistered, tradeInWantedList, setTradeInWantedList }) => {
  return (
    <div className="wanted-options">
      <div className="field-group-column">
        <div className="field">
          <label>Preferred Lucky</label>
          <input
            type="checkbox"
            checked={prefLucky}
            onChange={(e) => setPrefLucky(e.target.checked)}
          />
        </div>
      </div>
      <div className="field">
        <label>Already Registered?</label>
        <input
          type="checkbox"
          checked={alreadyRegistered}
          onChange={(e) => setAlreadyRegistered(e.target.checked)}
        />
      </div>
      <div className="field">
        <label>
          Include Only Matches who offer a Pokémon in your Wanted List
        </label>
        <input
          type="checkbox"
          checked={tradeInWantedList}
          onChange={(e) => setTradeInWantedList(e.target.checked)}
        />
      </div>
    </div>
  );
};

export default WantedSearch;
