// OwnershipSearch.jsx

import React, { useEffect } from 'react';
import './OwnershipSearch.css'; 
import OwnedSearch from './OwnershipComponents/OwnedSearch';
import TradeSearch from './OwnershipComponents/TradeSearch';
import WantedSearch from './OwnershipComponents/WantedSearch';

const OwnershipSearch = ({
  ownershipStatus,
  setOwnershipStatus,
  stats,
  setStats,
  isHundo,
  setIsHundo,
  onlyMatchingTrades,
  setOnlyMatchingTrades,
  prefLucky,
  setPrefLucky,
  alreadyRegistered,
  setAlreadyRegistered,
  tradeInWantedList,
  setTradeInWantedList,
  friendshipLevel,
  setFriendshipLevel,
}) => {
  const options = ['owned', 'trade', 'wanted'];

  const handleStatChange = (statName, value) => {
    setStats((prevStats) => ({
      ...prevStats,
      [statName]: value,
    }));
  };

  useEffect(() => {
    if (ownershipStatus !== 'owned') {
      setStats({ attack: null, defense: null, stamina: null });
      setIsHundo(false);
    }
  }, [ownershipStatus, setStats, setIsHundo]);

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
      setFriendshipLevel(0);  // Reset friendship level when not wanted
    }
  }, [ownershipStatus, setPrefLucky, setAlreadyRegistered, setTradeInWantedList, setFriendshipLevel]);

  return (
    <div className="ownership-status-container">
      {/* Header on its own row */}
      <h3 className="ownership-header">Ownership Status</h3>
  
      {/* Ownership content and options in the same row */}
      <div className="ownership-row">
        <div className="ownership-content">
          {ownershipStatus === 'owned' && (
            <OwnedSearch
              stats={stats}
              onStatChange={handleStatChange}
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
              tradeInWantedList={tradeInWantedList}
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