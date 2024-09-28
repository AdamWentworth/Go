// WantedSearch.jsx
import React from 'react';
import './WantedSearch.css'; // Import the specific CSS for WantedSearch

const WantedSearch = ({ prefLucky, setPrefLucky, alreadyRegistered, setAlreadyRegistered, tradeInWantedList, setTradeInWantedList }) => {
  return (
    <div className="wanted-search-options">
      <div className="field field-lucky">
        <input
          type="checkbox"
          checked={prefLucky}
          onChange={(e) => setPrefLucky(e.target.checked)}
        />
        <label>Preferred Lucky</label>
      </div>
      <div className="field field-registered">
        <input
          type="checkbox"
          checked={alreadyRegistered}
          onChange={(e) => setAlreadyRegistered(e.target.checked)}
        />
        <label>Already Registered?</label>
      </div>
      <div className="field field-wanted">
        <input
          type="checkbox"
          checked={tradeInWantedList}
          onChange={(e) => setTradeInWantedList(e.target.checked)}
        />
        <label>
          Include Only Results who offer a Pokémon in your Wanted List
        </label>
      </div>
    </div>
  );
};

export default WantedSearch;