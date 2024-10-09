// ListView.jsx

import React from 'react';
import './ListView.css';
import { URLSelect } from '../utils/URLSelect'; // Adjust the path as necessary
import FriendshipLevel from './ListViewComponents/FriendshipLevel';
import GenderIcon from './ListViewComponents/GenderIcon';
import MoveDisplay from './ListViewComponents/MoveDisplay';

const ListView = ({ data }) => {
  if (!Array.isArray(data)) {
    return <div>No data available.</div>;
  }
  console.log(data);

  return (
    <div className="list-view">
      {data.length === 0 ? (
        <div>No Pokémon found matching your criteria.</div>
      ) : (
        data.map((item, index) => {
          const imageUrl = URLSelect(item.pokemonInfo, item);
          const friendshipLevel = item.friendship_level || 0; // Default to 0 if undefined
          const prefLucky = item.pref_lucky || false; // Default to false if undefined

          return (
            <div key={index} className="card">
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
          );
        })
      )}
    </div>
  );
};

export default ListView;