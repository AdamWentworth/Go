// OwnershipSearch.jsx

import React, { useState, useEffect } from 'react';
import './OwnershipSearch.css'; // Import the CSS file for OwnershipSearch styling
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
}) => {
  const options = ['owned', 'trade', 'wanted']; // Define the options

  const handleStatChange = (statName, value) => {
    setStats((prevStats) => ({
      ...prevStats,
      [statName]: value,
    }));
  };

  // Reset IVs and isHundo when ownershipStatus changes away from 'owned'
  useEffect(() => {
    if (ownershipStatus !== 'owned') {
      setStats({ attack: null, defense: null, stamina: null });
      setIsHundo(false);
    }
  }, [ownershipStatus, setStats, setIsHundo]);

  // Reset onlyMatchingTrades when ownershipStatus changes away from 'trade'
  useEffect(() => {
    if (ownershipStatus !== 'trade') {
      setOnlyMatchingTrades(false);
    }
  }, [ownershipStatus, setOnlyMatchingTrades]);

  // Reset 'wanted' specific states when ownershipStatus changes away from 'wanted'
  useEffect(() => {
    if (ownershipStatus !== 'wanted') {
      setPrefLucky(false);
      setAlreadyRegistered(false);
      setTradeInWantedList(false);
    }
  }, [ownershipStatus, setPrefLucky, setAlreadyRegistered, setTradeInWantedList]);

  return (
    <div className="ownership-status-container">
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
          />
        )}
      </div>

      {/* Right Column: Static Ownership Options Buttons */}
      <div className="ownership-options-container">
        <h3 className="ownership-header">Ownership Status</h3>
        <div className="ownership-options">
          {options.map((option) => (
            <button
              key={option}
              className={`ownership-button ${
                ownershipStatus === option ? 'active ' + option : 'inactive ' + option
              }`}
              onClick={() => setOwnershipStatus(option)}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OwnershipSearch;