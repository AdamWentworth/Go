// ListView.jsx

import React from 'react';
import './ListView.css';
import { URLSelect } from '../utils/URLSelect';
import getPokemonDisplayName from '../utils/getPokemonDisplayName';
import FriendshipLevel from './ListViewComponents/FriendshipLevel';
import GenderIcon from './ListViewComponents/GenderIcon';
import MoveDisplay from './ListViewComponents/MoveDisplay';
import MiniMap from './ListViewComponents/MiniMap';
import IVDisplay from './ListViewComponents/IVDisplay';
import CPDisplay from './ListViewComponents/CPDisplay';

const ListView = ({ data, ownershipStatus, hasSearched }) => {
  console.log(data);

  // Default message before any search is made
  if (!hasSearched && data.length === 0) {
    return (
      <div className="no-data-container">
        <p>Use the Toolbar above to Discover Pokémon near you and Around the World.</p>
      </div>
    );
  }

  // Message when no results match the search criteria
  if (hasSearched && data.length === 0) {
    return (
      <div className="no-data-container">
        <p>No Pokémon found matching your criteria.</p>
      </div>
    );
  }

  // Helper function to format date to YYYY-MM-DD
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
  };

  return (
    <div className="list-view-container">
      {data.map((item, index) => {
        const imageUrl = URLSelect(item.pokemonInfo, item);
        const friendshipLevel = item.friendship_level || 0;
        const prefLucky = item.pref_lucky || false;
        const latitude = item.latitude ? parseFloat(item.latitude) : 49.2608724;
        const longitude = item.longitude ? parseFloat(item.longitude) : -123.113952;

        const pokemonDisplayName = getPokemonDisplayName(item);

        // Determine whether to show lucky backdrop based on ownership status
        let showLuckyBackdrop = false;

        if (ownershipStatus === 'owned' && item.lucky) {
          showLuckyBackdrop = true;
        } else if (ownershipStatus === 'wanted' && prefLucky) {
          showLuckyBackdrop = true;
        }

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

                {ownershipStatus === 'owned' && (
                  <>
                    <CPDisplay cp={item.cp} />
                  </>
                )}

                {item.pokemonInfo && (
                  <div className="pokemon-image-container">
                    {/* Render lucky backdrop conditionally based on ownershipStatus */}
                    {showLuckyBackdrop && (
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
              <div className="weight-height-move-container">
                {/* Conditionally Add weight */}
                {item.weight !== null && (
                  <div className="weight-height">
                    <p><strong>{item.weight}kg</strong> WEIGHT</p>
                  </div>
                )}

                {/* MoveDisplay */}
                <MoveDisplay
                  fastMoveId={item.fast_move_id}
                  chargedMove1Id={item.charged_move1_id}
                  chargedMove2Id={item.charged_move2_id}
                  moves={item.pokemonInfo.moves}
                />

                {/* Conditionally Add height */}
                {item.height !== null && (
                  <div className="weight-height">
                    <p><strong>{item.height}m</strong> HEIGHT</p>
                  </div>
                )}
              </div>

              {ownershipStatus === 'owned' && (
                <>
                  <IVDisplay item={item} />
                </>
              )}

              {/* Location Caught and Date Caught for both "owned" and "trade" */}
              {(ownershipStatus === 'owned' || ownershipStatus === 'trade') && (
                <>
                  {/* Conditionally render Location Caught */}
                  {item.location_caught && (
                    <div className="location-caught">
                      <p><strong>Location Caught: </strong>{item.location_caught}</p>
                    </div>
                  )}

                  {/* Conditionally render Date Caught */}
                  {item.date_caught && (
                    <div className="date-caught">
                      <p><strong>Date Caught: </strong>{formatDate(item.date_caught)}</p>
                    </div>
                  )}
                </>
              )}

              {ownershipStatus !== 'owned' && <p>{ownershipStatus}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ListView;