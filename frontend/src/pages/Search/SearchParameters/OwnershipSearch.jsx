// OwnershipSearch.jsx

import React, { useEffect } from 'react';
import './OwnershipSearch.css'; 
import CaughtSearch from './OwnershipComponents/CaughtSearch.jsx';
import TradeSearch from './OwnershipComponents/TradeSearch.jsx';
import WantedSearch from './OwnershipComponents/WantedSearch.jsx';
import { normalizeOwnershipMode } from '../utils/ownershipMode';

const OwnershipSearch = ({
  ownershipMode,
  setOwnershipMode,
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
  const options = ['caught', 'trade', 'wanted'];
  const activeMode = normalizeOwnershipMode(ownershipMode);

  const handleIvChange = (newIvs) => {
    setIvs(newIvs);
  };  

  useEffect(() => {
    if (activeMode !== 'caught') {
      setIvs({ Attack: null, Defense: null, Stamina: null });
      setIsHundo(false);
    }
  }, [activeMode, setIvs, setIsHundo]);

  useEffect(() => {
    if (activeMode !== 'trade') {
      setOnlyMatchingTrades(false);
    }
  }, [activeMode, setOnlyMatchingTrades]);

  useEffect(() => {
    if (activeMode !== 'wanted') {
      setPrefLucky(false);
      setAlreadyRegistered(false);
      setTradeInWantedList(false);
      setFriendshipLevel(0);
    }
  }, [activeMode, setPrefLucky, setAlreadyRegistered, setTradeInWantedList, setFriendshipLevel]);

  return (
    <div className="ownership-status-container">
      <h3 className="ownership-header">Ownership Status</h3>
      <div className="ownership-row">
        <div className="ownership-content">
          {activeMode === 'caught' && (
            <CaughtSearch
              ivs={ivs}
              onIvChange={handleIvChange}
              isHundo={isHundo}
              setIsHundo={setIsHundo}
            />
          )}
  
          {activeMode === 'trade' && (
            <TradeSearch
              onlyMatchingTrades={onlyMatchingTrades}
              setOnlyMatchingTrades={setOnlyMatchingTrades}
            />
          )}
  
          {activeMode === 'wanted' && (
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
                className={`ownership-button ${activeMode === option ? 'active ' + option : 'inactive ' + option}`}
                onClick={() => setOwnershipMode(option)}
              >
                {option === 'caught' ? 'Caught' : option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );  
};

export default OwnershipSearch;
