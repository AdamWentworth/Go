// WantedListView.jsx

import React, { useState } from 'react'; // Import useState
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import MiniMap from './MiniMap.jsx';
import MoveDisplay from '../../../../components/pokemonComponents/MoveDisplay.jsx';
import Gender from '../../../../components/pokemonComponents/Gender';
import CP from '../../../../components/pokemonComponents/CP.jsx';
import FriendshipLevel from '../../../../components/pokemonComponents/FriendshipLevel.jsx';
import ConfirmationOverlay from '../ConfirmationOverlay.jsx'; // Import ConfirmationOverlay
import { URLSelect } from '../../utils/URLSelect';
import getPokemonDisplayName from '../../utils/getPokemonDisplayName';
import './WantedListView.css';

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
};

const WantedListView = ({ item, findPokemonByKey }) => {
  const navigate = useNavigate();
  const [showConfirmation, setShowConfirmation] = useState(false); // State for confirmation overlay
  const imageUrl = URLSelect(item.pokemonInfo, item);
  const dynamax = item.dynamax;
  const gigantamax = item.gigantamax;
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

  // Open confirmation overlay
  const handleOpenConfirmation = () => {
    setShowConfirmation(true);
  };

  // Confirm and navigate to user's catalog with "Wanted" instanceData
  const handleConfirmNavigation = () => {
    navigate(`/pokemon/${item.username}`, { state: { instanceId: item.instance_id, instanceData: "Wanted" } });
    setShowConfirmation(false);
  };

  // Close the confirmation overlay without navigating
  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
  };

  return (
    <div className="list-view-row wanted-list-view">
      {/* Left Column: MiniMap */}
      <div className="left-column">
        {item.distance > 0 && item.distance && <p>Distance: {item.distance.toFixed(2)} km</p>}
        <MiniMap
          latitude={item.latitude}
          longitude={item.longitude}
          instanceData="wanted"
        />
      </div>

      {/* Center Column */}
      <div className="center-column" onClick={handleOpenConfirmation}>
        <div className="card">
          <h3>{item.username}</h3>

          {hasAdditionalDetails ? (
            // Two-column layout
            <div className="pokemon-columns">
              {/* First Column: CP and Pokémon Image */}
              <div className="pokemon-first-column">
              {item.cp > 0 && item.cp && <CP cp={item.cp} />}
                <div className="pokemon-image-container">
                  {item.pref_lucky && (
                  <div className="lucky-backdrop-wrapper">
                    <img
                      src={`/images/lucky.png`}
                      alt="Lucky backdrop"
                      className="lucky-backdrop"
                    />
                  </div>
                  )}
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt={pokemonDisplayName}
                      className="pokemon-image"
                    />
                  )}
                  {dynamax && (
                    <img 
                      src={'/images/dynamax.png'} 
                      alt="Dynamax Badge" 
                      className="max-badge" 
                    />
                  )}
                  {gigantamax && (
                    <img 
                      src={'/images/gigantamax.png'} 
                      alt="Gigantamax Badge" 
                      className="max-badge" 
                    />
                  )}
                <p className="pokemon-name">
                  {pokemonDisplayName}
                  <Gender gender={item.gender} />
                </p>
                </div>
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
                  {item.weight > 0 && item.weight && (
                    <div className="pokemon-weight">
                      <p>
                        <strong>{item.weight}kg</strong>
                      </p>
                      <p>WEIGHT</p>
                    </div>
                  )}
                  {item.height > 0 && item.height && (
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
              {item.cp && <CP cp={item.cp} />}
              <div className="pokemon-image-container">
                {item.pref_lucky && (
                  <img
                    src={`/images/lucky.png`}
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
                {dynamax && (
                  <img 
                    src={'/images/dynamax.png'} 
                    alt="Dynamax Badge" 
                    className="max-badge" 
                  />
                )}
                {gigantamax && (
                  <img 
                    src={'/images/gigantamax.png'} 
                    alt="Gigantamax Badge" 
                    className="max-badge" 
                  />
                )}
              <p className="pokemon-name">
                {pokemonDisplayName}
                <GenderIcon gender={item.gender} />
              </p>
              </div>
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
                const tradeListPokemon = item.trade_list[pokemonKeyWithUUID];
                const matchedPokemon = findPokemonByKey(pokemonKeyWithUUID, tradeListPokemon);

                if (!matchedPokemon) return null;

                return (
                  <div
                    key={pokemonKeyWithUUID}
                    className="trade-pokemon-container"
                    style={{ position: 'relative' }}
                  >
                    {/* Dynamax Icon */}
                    {tradeListPokemon.dynamax && (
                      <img
                        src={`/images/dynamax.png`}
                        alt="Dynamax"
                        style={{
                          position: 'absolute',
                          top: '5%',
                          right: '5%',
                          width: '30%',
                          height: '30%',
                          zIndex: 1,
                        }}
                      />
                    )}

                    {/* Gigantamax Icon */}
                    {tradeListPokemon.gigantamax && (
                      <img
                        src={`/images/gigantamax.png`}
                        alt="Gigantamax"
                        style={{
                          position: 'absolute',
                          top: '5%',
                          right: '5%', // Adjust position if both icons are present
                          width: '30%',
                          height: '30%',
                          zIndex: 1,
                        }}
                      />
                    )}

                    {/* Pokémon Image */}
                    <img
                      src={matchedPokemon.currentImage}
                      alt={matchedPokemon.name}
                      className={`trade-pokemon-image ${tradeListPokemon.match ? 'glowing-pokemon' : ''}`}
                      title={`${matchedPokemon.form ? `${matchedPokemon.form} ` : ''}${matchedPokemon.name}`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Overlay */}
      {showConfirmation && (
        <ConfirmationOverlay
          username={item.username}
          pokemonDisplayName={pokemonDisplayName}
          instanceId={item.instance_id}
          onConfirm={handleConfirmNavigation}
          onClose={handleCloseConfirmation}
        />
      )}
    </div>
  );
};

export default WantedListView;
