// WantedListView.jsx

import React from 'react';
import MiniMap from './ListViewComponents/MiniMap';
import MoveDisplay from './ListViewComponents/MoveDisplay';
import GenderIcon from './ListViewComponents/GenderIcon';
import CPDisplay from './ListViewComponents/CPDisplay';
import FriendshipLevel from './ListViewComponents/FriendshipLevel'; // Import the component
import { URLSelect } from '../utils/URLSelect';
import getPokemonDisplayName from '../utils/getPokemonDisplayName';
import { parsePokemonKey } from '../../../utils/PokemonIDUtils';
import './WantedListView.css';

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
};

const WantedListView = ({ item, findPokemonByKey }) => {
  const imageUrl = URLSelect(item.pokemonInfo, item);
  const pokemonDisplayName = getPokemonDisplayName(item);

  // Check if any additional details are present
  const hasAdditionalDetails =
    item.weight ||
    item.height ||
    item.fast_move_id ||
    item.charged_move1_id ||
    item.charged_move2_id ||
    item.location_caught ||
    item.date_caught;

  return (
    <div className="list-view-row wanted-list-view">
      {/* Left Column: MiniMap */}
      <div className="left-column">
        {item.distance && <p>Distance: {item.distance.toFixed(2)} km</p>}
        <MiniMap
          latitude={item.latitude}
          longitude={item.longitude}
          ownershipStatus="wanted"
        />
      </div>

      {/* Center Column */}
      <div className="center-column">
        <div className="card">
          <h3>{item.username}</h3>

          {hasAdditionalDetails ? (
            // Two-column layout
            <div className="pokemon-columns">
              {/* First Column: CP and Pokémon Image */}
              <div className="pokemon-first-column">
                {item.cp && <CPDisplay cp={item.cp} />}
                <div className="pokemon-image-container">
                  {item.pref_lucky && (
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
                </div>
                <p className="pokemon-name">
                  {pokemonDisplayName}
                  <GenderIcon gender={item.gender} />
                </p>
              </div>

              {/* Second Column: Weight, Height, Moves, Friendship, Location, and Date */}
              <div className="pokemon-second-column">
                {/* Add the FriendshipLevel component */}
                {item.friendship_level && (
                  <div className="pokemon-friendship">
                    <FriendshipLevel
                      level={item.friendship_level}
                      prefLucky={item.pref_lucky}
                    />
                  </div>
                )}
                <div className="pokemon-weight-height">
                  {item.weight && (
                    <div className="pokemon-weight">
                      <p>
                        <strong>{item.weight}kg</strong>
                      </p>
                      <p>WEIGHT</p>
                    </div>
                  )}
                  {item.height && (
                    <div className="pokemon-height">
                      <p>
                        <strong>{item.height}m</strong>
                      </p>
                      <p>HEIGHT</p>
                    </div>
                  )}
                </div>

                {(item.fast_move_id ||
                  item.charged_move1_id ||
                  item.charged_move2_id) && (
                  <div className="pokemon-moves">
                    <MoveDisplay
                      fastMoveId={item.fast_move_id}
                      chargedMove1Id={item.charged_move1_id}
                      chargedMove2Id={item.charged_move2_id}
                      moves={item.pokemonInfo.moves}
                    />
                  </div>
                )}

                {item.location_caught && (
                  <div className="pokemon-location">
                    <p>
                      <strong>Location Caught: </strong>
                      {item.location_caught}
                    </p>
                  </div>
                )}

                {item.date_caught && (
                  <div className="pokemon-date">
                    <p>
                      <strong>Date Caught: </strong>
                      {formatDate(item.date_caught)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Single-column layout
            <div className="pokemon-single-column">
              {item.cp && <CPDisplay cp={item.cp} />}
              <div className="pokemon-image-container">
                {item.pref_lucky && (
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
              </div>
              <p className="pokemon-name">
                {pokemonDisplayName}
                <GenderIcon gender={item.gender} />
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Trade List */}
      <div className="right-column">
        {item.trade_list && (
          <div className="trade-list-section">
            <h1>Trade Pokémon:</h1>
            <div className="trade-list">
              {Object.keys(item.trade_list).map((pokemonKeyWithUUID) => {
                const { baseKey } = parsePokemonKey(pokemonKeyWithUUID);
                const matchedPokemon = findPokemonByKey(baseKey);

                return matchedPokemon ? (
                  <img
                    key={pokemonKeyWithUUID}
                    src={matchedPokemon.currentImage}
                    alt={matchedPokemon.name}
                    className="trade-pokemon-image"
                  />
                ) : null;
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WantedListView;