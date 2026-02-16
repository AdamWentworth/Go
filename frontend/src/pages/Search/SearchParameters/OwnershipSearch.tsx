import React, { useEffect } from 'react';

import './OwnershipSearch.css';
import CaughtSearch from './OwnershipComponents/CaughtSearch';
import TradeSearch from './OwnershipComponents/TradeSearch';
import WantedSearch from './OwnershipComponents/WantedSearch';
import {
  normalizeOwnershipMode,
  type SearchOwnershipMode,
  type SearchOwnershipModeInput,
} from '../utils/ownershipMode';

type IvValues = {
  Attack: number | '' | null;
  Defense: number | '' | null;
  Stamina: number | '' | null;
};

type OwnershipSearchProps = {
  ownershipMode: SearchOwnershipModeInput;
  setOwnershipMode: React.Dispatch<React.SetStateAction<SearchOwnershipMode>>;
  ivs: IvValues;
  setIvs: React.Dispatch<React.SetStateAction<IvValues>>;
  isHundo: boolean;
  setIsHundo: React.Dispatch<React.SetStateAction<boolean>>;
  onlyMatchingTrades: boolean;
  setOnlyMatchingTrades: React.Dispatch<React.SetStateAction<boolean>>;
  prefLucky: boolean;
  setPrefLucky: React.Dispatch<React.SetStateAction<boolean>>;
  alreadyRegistered: boolean;
  setAlreadyRegistered: React.Dispatch<React.SetStateAction<boolean>>;
  trade_in_wanted_list?: boolean;
  tradeInWantedList?: boolean;
  setTradeInWantedList: React.Dispatch<React.SetStateAction<boolean>>;
  friendshipLevel: number;
  setFriendshipLevel: React.Dispatch<React.SetStateAction<number>>;
};

const options: SearchOwnershipMode[] = ['caught', 'trade', 'wanted'];

const OwnershipSearch: React.FC<OwnershipSearchProps> = ({
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
  tradeInWantedList,
  setTradeInWantedList,
  friendshipLevel,
  setFriendshipLevel,
}) => {
  const activeMode = normalizeOwnershipMode(ownershipMode);
  const activeTradeInWantedList =
    tradeInWantedList ?? trade_in_wanted_list ?? false;

  const handleIvChange = (newIvs: IvValues) => {
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
  }, [
    activeMode,
    setPrefLucky,
    setAlreadyRegistered,
    setTradeInWantedList,
    setFriendshipLevel,
  ]);

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
              tradeInWantedList={activeTradeInWantedList}
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
                type="button"
                className={`ownership-button ${activeMode === option ? `active ${option}` : `inactive ${option}`}`}
                onClick={() => setOwnershipMode(option)}
              >
                {option === 'caught'
                  ? 'Caught'
                  : option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnershipSearch;
