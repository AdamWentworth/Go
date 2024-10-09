// ListView.jsx

import React from 'react';
import './ListView.css';
import { URLSelect } from '../utils/URLSelect'; // Adjust the path as necessary

const ListView = ({ data }) => {
  if (!Array.isArray(data)) {
    return <div>No data available.</div>;
  }
  console.log(data);

  // Helper function to render friendship level hearts
  const renderFriendshipLevel = (level, prefLucky) => {
    const hearts = [];
    for (let i = 0; i < 4; i++) {
      hearts.push(
        <img
          key={`heart-${i}`}
          src={`${process.env.PUBLIC_URL}/images/${i < level ? 'heart-filled' : 'heart-unfilled'}.png`}
          alt={`Friendship Level ${i < level ? 'Filled' : 'Unfilled'}`}
          className="heart"
        />
      );
    }

    return (
      <div className="hearts-lucky-container">
        <div className="hearts">{hearts}</div>
        <img
          src={`${process.env.PUBLIC_URL}/images/lucky_friend_icon.png`}
          alt="Lucky Friend"
          className={`lucky-icon ${prefLucky ? '' : 'grey-out'}`}
        />
      </div>
    );
  };

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
              <p>Location: {item.location}</p>
              {item.distance && (
                <p>Distance: {item.distance.toFixed(2)} km</p>
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
                  <p>Pokémon: {item.pokemonInfo.name}</p>
                </div>
              )}
              {/* Render friendship level */}
              <div className="friendship-level">
                {renderFriendshipLevel(friendshipLevel, prefLucky)}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default ListView;
