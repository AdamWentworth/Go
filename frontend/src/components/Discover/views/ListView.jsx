// ListView.jsx

import React from 'react';
import './ListView.css';
import { URLSelect } from '../utils/URLSelect'; // Adjust the path as necessary
import FriendshipLevel from './ListViewComponents/FriendshipLevel';
import GenderIcon from './ListViewComponents/GenderIcon';
import MoveDisplay from './ListViewComponents/MoveDisplay';
import MiniMap from './ListViewComponents/MiniMap'; // Import the MiniMap component

const ListView = ({ data }) => {
  if (!Array.isArray(data)) {
    return <div>No data available.</div>;
  }

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

          return (
            <div key={index} className="list-view-row">
              {/* Left Column: MiniMap */}
              <div className="left-column">
                <MiniMap latitude={latitude} longitude={longitude} />
              </div>

              {/* Center Column: Current Content */}
              <div className="center-column">
                <div className="card">
                  <h3>{item.username}</h3>
                  {item.distance && <p>Distance: {item.distance.toFixed(2)} km</p>}

                  {/* Render friendship level only if the Pokémon is wanted */}
                  {item.is_wanted && (
                    <FriendshipLevel level={friendshipLevel} prefLucky={prefLucky} />
                  )}

                  {item.pokemonInfo && (
                    <div className="pokemon-image-container">
                      {/* Render lucky background if prefLucky is true */}
                      {prefLucky && (
                        <img
                          src={`${process.env.PUBLIC_URL}/images/lucky.png`}
                          alt="Lucky backdrop"
                          className="lucky-backdrop"
                        />
                      )}
                      {/* Render Pokémon image */}
                      {imageUrl && (
                        <img
                          src={imageUrl}
                          alt={item.pokemonInfo.name}
                          className="pokemon-image"
                        />
                      )}
                      <p className="pokemon-name">
                        {item.pokemonInfo.name}
                        {/* Render gender icon */}
                        <GenderIcon gender={item.gender} />
                      </p>
                    </div>
                  )}

                  {/* Render moves */}
                  <MoveDisplay
                    fastMoveId={item.fast_move_id}
                    chargedMove1Id={item.charged_move1_id}
                    chargedMove2Id={item.charged_move2_id}
                    moves={item.pokemonInfo.moves}
                  />
                </div>
              </div>

              {/* Right Column: Dynamic Content Placeholder */}
              <div className="right-column">
                <div className="dynamic-content">
                  <p>Dynamic Content</p>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default ListView;