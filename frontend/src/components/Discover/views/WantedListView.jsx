// WantedListView.jsx

import React from 'react';
import MiniMap from './ListViewComponents/MiniMap';
import FriendshipLevel from './ListViewComponents/FriendshipLevel';
import MoveDisplay from './ListViewComponents/MoveDisplay';
import GenderIcon from './ListViewComponents/GenderIcon';
import { URLSelect } from '../utils/URLSelect';
import getPokemonDisplayName from '../utils/getPokemonDisplayName';
import './WantedListView.css';

const WantedListView = ({ item }) => {
  const imageUrl = URLSelect(item.pokemonInfo, item);
  const pokemonDisplayName = getPokemonDisplayName(item);

  return (
    <div className="list-view-row wanted-list-view">
      <div className="left-column">
        {item.distance && <p>Distance: {item.distance.toFixed(2)} km</p>}
        <MiniMap latitude={item.latitude} longitude={item.longitude} ownershipStatus="wanted" />
      </div>

      <div className="center-column">
        <div className="card">
          <h3>{item.username}</h3>
          <FriendshipLevel level={item.friendship_level} prefLucky={item.pref_lucky} />
          {item.pokemonInfo && (
            <div className="pokemon-image-container">
              {item.pref_lucky && (
                <img
                  src={`${process.env.PUBLIC_URL}/images/lucky.png`}
                  alt="Lucky backdrop"
                  className="lucky-backdrop"
                />
              )}
              {imageUrl && <img src={imageUrl} alt={pokemonDisplayName} className="pokemon-image" />}
              <p className="pokemon-name">
                {pokemonDisplayName}
                <GenderIcon gender={item.gender} />
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="right-column">
        <MoveDisplay
          fastMoveId={item.fast_move_id}
          chargedMove1Id={item.charged_move1_id}
          chargedMove2Id={item.charged_move2_id}
          moves={item.pokemonInfo.moves}
        />
      </div>
    </div>
  );
};

export default WantedListView;