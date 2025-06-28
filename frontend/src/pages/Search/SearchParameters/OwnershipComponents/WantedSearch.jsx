// WantedSearch.jsx
import React from 'react';
import './WantedSearch.css'; 
import FriendshipSearch from './FriendshipSearch.jsx';

const WantedSearch = ({ 
  prefLucky, 
  setPrefLucky, 
  alreadyRegistered, 
  setAlreadyRegistered, 
  tradeInWantedList, 
  setTradeInWantedList,
  friendshipLevel, 
  setFriendshipLevel 
}) => {
  return (
    <div className="wanted-search-options">
      <div className="search-row">
        <FriendshipSearch 
          friendshipLevel={friendshipLevel}
          setFriendshipLevel={setFriendshipLevel}
          prefLucky={prefLucky}
          setPrefLucky={setPrefLucky}
        />
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