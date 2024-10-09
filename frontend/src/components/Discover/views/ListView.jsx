// ListView.jsx

import React from 'react';
import './ListView.css';
import { URLSelect } from '../utils/URLSelect';
import getPokemonDisplayName from '../utils/getPokemonDisplayName'; // Import the new utility
import FriendshipLevel from './ListViewComponents/FriendshipLevel';
import GenderIcon from './ListViewComponents/GenderIcon';
import MoveDisplay from './ListViewComponents/MoveDisplay';
import MiniMap from './ListViewComponents/MiniMap';
import IVDisplay from './ListViewComponents/IVDisplay'; // Import IVDisplay

const ListView = ({ data, ownershipStatus }) => {
  if (!Array.isArray(data)) {
    return <div>No data available.</div>;
  }

  console.log(data)

  return (
    <div className="list-view-container">
      {data.length === 0 ? (
        <div>No Pokémon found matching your criteria.</div>
      ) : (
        data.map((item, index) => {
          const imageUrl = URLSelect(item.pokemonInfo, item);
          const friendshipLevel = item.friendship_level || 0;
          const prefLucky = item.pref_lucky || false;
          const latitude = item.latitude ? parseFloat(item.latitude) : 49.2608724; // Default latitude
          const longitude = item.longitude ? parseFloat(item.longitude) : -123.113952; // Default longitude

          // Get the Pokémon's formatted display name
          const pokemonDisplayName = getPokemonDisplayName(item);

          return (
            <div key={index} className="list-view-row">
              {/* Left Column: MiniMap */}
              <div className="left-column">
              {item.distance && <p>Distance: {item.distance.toFixed(2)} km</p>}
                <MiniMap latitude={latitude} longitude={longitude} ownershipStatus={ownershipStatus} />
              </div>

              {/* Center Column: Current Content */}
              <div className="center-column">
                <div className="card">
                  <h3>{item.username}</h3>

                  {/* Render friendship level only if the Pokémon is wanted */}
                  {ownershipStatus === 'wanted' && (
                    <FriendshipLevel level={friendshipLevel} prefLucky={prefLucky} />
                  )}

                  {item.pokemonInfo && (
                    <div className="pokemon-image-container">
                      {prefLucky && (
                        <img
                          src={`${process.env.PUBLIC_URL}/images/lucky.png`}
                          alt="Lucky backdrop"
                          className="lucky-backdrop"
                        />
                      )}
                      {imageUrl && (
                        <img
                          src={imageUrl}
                          alt={pokemonDisplayName}
                          className="pokemon-image"
                        />
                      )}
                      <p className="pokemon-name">
                        {pokemonDisplayName}
                        <GenderIcon gender={item.gender} />
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Dynamic Content */}
              <div className="right-column">
                  <MoveDisplay
                    fastMoveId={item.fast_move_id}
                    chargedMove1Id={item.charged_move1_id}
                    chargedMove2Id={item.charged_move2_id}
                    moves={item.pokemonInfo.moves}
                  />
                {ownershipStatus === 'owned' && (
                  <IVDisplay item={item} />
                )}
                {ownershipStatus !== 'owned' && (
                  <p>{ownershipStatus}</p>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default ListView;