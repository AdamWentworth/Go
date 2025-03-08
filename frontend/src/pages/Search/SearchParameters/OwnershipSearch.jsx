// OwnershipSearch.jsx

import React, { useEffect } from 'react';
import './OwnershipSearch.css'; 
import OwnedSearch from './OwnershipComponents/OwnedSearch';
import TradeSearch from './OwnershipComponents/TradeSearch';
import WantedSearch from './OwnershipComponents/WantedSearch';

const OwnershipSearch = ({
  ownershipStatus,
  setOwnershipStatus,
  ivs,
  setIvs,
  isHundo,
  setIsHundo,
  onlyMatchingTrades,
  setOnlyMatchingTrades,
  prefLucky,
  setPrefLucky,
  alreadyRegistered,
  setAlreadyRegistered,
  trade_in_wanted_list,
  setTradeInWantedList,
  friendshipLevel,
  setFriendshipLevel,
}) => {
  const options = ['owned', 'trade', 'wanted'];

  const handleIvChange = (newIvs) => {
    setIvs(newIvs);
  };  

  useEffect(() => {
    if (ownershipStatus !== 'owned') {
      setIvs({ Attack: null, Defense: null, Stamina: null });
      setIsHundo(false);
    }
  }, [ownershipStatus, setIvs, setIsHundo]);

  useEffect(() => {
    if (ownershipStatus !== 'trade') {
      setOnlyMatchingTrades(false);
    }
  }, [ownershipStatus, setOnlyMatchingTrades]);

  useEffect(() => {
    if (ownershipStatus !== 'wanted') {
      setPrefLucky(false);
      setAlreadyRegistered(false);
      setTradeInWantedList(false);
      setFriendshipLevel(0);
    }
  }, [ownershipStatus, setPrefLucky, setAlreadyRegistered, setTradeInWantedList, setFriendshipLevel]);

  return (
    <div className="ownership-status-container">
      <h3 className="ownership-header">Ownership Status</h3>
      <div className="ownership-row">
        <div className="ownership-content">
          {ownershipStatus === 'owned' && (
            <OwnedSearch
              ivs={ivs}
              onIvChange={handleIvChange}
              isHundo={isHundo}
              setIsHundo={setIsHundo}
            />
          )}
  
          {ownershipStatus === 'trade' && (
            <TradeSearch
              onlyMatchingTrades={onlyMatchingTrades}
              setOnlyMatchingTrades={setOnlyMatchingTrades}
            />
          )}
  
          {ownershipStatus === 'wanted' && (
            <WantedSearch
              prefLucky={prefLucky}
              setPrefLucky={setPrefLucky}
              alreadyRegistered={alreadyRegistered}
              setAlreadyRegistered={setAlreadyRegistered}
              trade_in_wanted_list={trade_in_wanted_list}
              setTradeInWantedList={setTradeInWantedList}
              friendshipLevel={friendshipLevel}
              setFriendshipLevel={setFriendshipLevel}
            />
          )}
        </div>
  
        <div className="ownership-options-container">
          <div className="ownership-options">
            {options.map((option) => (
              <button
                key={option}
                className={`ownership-button ${ownershipStatus === option ? 'active ' + option : 'inactive ' + option}`}
                onClick={() => setOwnershipStatus(option)}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );  
};

export default OwnershipSearch;