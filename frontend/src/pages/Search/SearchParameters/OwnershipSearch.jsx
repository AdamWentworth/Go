// OwnershipSearch.jsx

import React, { useEffect } from 'react';
import './OwnershipSearch.css'; 
import OwnedSearch from './OwnershipComponents/OwnedSearch.jsx';
import TradeSearch from './OwnershipComponents/TradeSearch.jsx';
import WantedSearch from './OwnershipComponents/WantedSearch.jsx';

const OwnershipSearch = ({
  instanceData,
  setinstanceData,
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
    if (instanceData !== 'owned') {
      setIvs({ Attack: null, Defense: null, Stamina: null });
      setIsHundo(false);
    }
  }, [instanceData, setIvs, setIsHundo]);

  useEffect(() => {
    if (instanceData !== 'trade') {
      setOnlyMatchingTrades(false);
    }
  }, [instanceData, setOnlyMatchingTrades]);

  useEffect(() => {
    if (instanceData !== 'wanted') {
      setPrefLucky(false);
      setAlreadyRegistered(false);
      setTradeInWantedList(false);
      setFriendshipLevel(0);
    }
  }, [instanceData, setPrefLucky, setAlreadyRegistered, setTradeInWantedList, setFriendshipLevel]);

  return (
    <div className="ownership-status-container">
      <h3 className="ownership-header">Ownership Status</h3>
      <div className="ownership-row">
        <div className="ownership-content">
          {instanceData === 'owned' && (
            <OwnedSearch
              ivs={ivs}
              onIvChange={handleIvChange}
              isHundo={isHundo}
              setIsHundo={setIsHundo}
            />
          )}
  
          {instanceData === 'trade' && (
            <TradeSearch
              onlyMatchingTrades={onlyMatchingTrades}
              setOnlyMatchingTrades={setOnlyMatchingTrades}
            />
          )}
  
          {instanceData === 'wanted' && (
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
                className={`ownership-button ${instanceData === option ? 'active ' + option : 'inactive ' + option}`}
                onClick={() => setinstanceData(option)}
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