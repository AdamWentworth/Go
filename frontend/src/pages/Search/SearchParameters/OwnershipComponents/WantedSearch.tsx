import React from 'react';

import FriendshipSearch from './FriendshipSearch';
import './WantedSearch.css';

type WantedSearchProps = {
  prefLucky: boolean;
  setPrefLucky: React.Dispatch<React.SetStateAction<boolean>>;
  alreadyRegistered: boolean;
  setAlreadyRegistered: React.Dispatch<React.SetStateAction<boolean>>;
  tradeInWantedList?: boolean;
  trade_in_wanted_list?: boolean;
  setTradeInWantedList: React.Dispatch<React.SetStateAction<boolean>>;
  friendshipLevel: number;
  setFriendshipLevel: React.Dispatch<React.SetStateAction<number>>;
};

const WantedSearch: React.FC<WantedSearchProps> = ({
  prefLucky,
  setPrefLucky,
  alreadyRegistered,
  setAlreadyRegistered,
  tradeInWantedList,
  trade_in_wanted_list,
  setTradeInWantedList,
  friendshipLevel,
  setFriendshipLevel,
}) => {
  const activeTradeInWantedList =
    tradeInWantedList ?? trade_in_wanted_list ?? false;

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
          onChange={(event) => setAlreadyRegistered(event.target.checked)}
        />
        <label>Already Registered?</label>
      </div>

      <div className="field field-wanted">
        <input
          type="checkbox"
          checked={activeTradeInWantedList}
          onChange={(event) => setTradeInWantedList(event.target.checked)}
        />
        <label>Include only results who offer a Pokemon in your wanted list</label>
      </div>
    </div>
  );
};

export default WantedSearch;
