// TradeListView.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MiniMap from './ListViewComponents/MiniMap';
import MoveDisplay from './ListViewComponents/MoveDisplay';
import GenderIcon from './ListViewComponents/GenderIcon';
import CPDisplay from './ListViewComponents/CPDisplay';
import ConfirmationOverlay from './ConfirmationOverlay'; // Import ConfirmationOverlay
import { URLSelect } from '../utils/URLSelect';
import getPokemonDisplayName from '../utils/getPokemonDisplayName';
import { parsePokemonKey } from '../../../utils/PokemonIDUtils';
import './TradeListView.css';

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
};

const TradeListView = ({ item, findPokemonByKey }) => {
  const navigate = useNavigate();
  const [showConfirmation, setShowConfirmation] = useState(false); // State for confirmation overlay
  const imageUrl = URLSelect(item.pokemonInfo, item);
  const pokemonDisplayName = getPokemonDisplayName(item);

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

  // Confirm and navigate to user's catalog with "Trade" ownershipStatus
  const handleConfirmNavigation = () => {
    navigate(`/${item.username}`, { state: { instanceId: item.instance_id, ownershipStatus: "Trade" } });
    setShowConfirmation(false);
  };

  // Close the confirmation overlay without navigating
  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
  };

  return (
    <div className="list-view-row trade-list-view">
      {/* Left Column: MiniMap */}
      <div className="left-column">
        {item.distance && <p>Distance: {item.distance.toFixed(2)} km</p>}
        <MiniMap
          latitude={item.latitude}
          longitude={item.longitude}
          ownershipStatus="trade"
        />
      </div>

      {/* Center Column */}
      <div className="center-column" onClick={handleOpenConfirmation}>
        <div className="card">
          <h3>{item.username}</h3>

          {hasAdditionalDetails ? (
            <div className="pokemon-columns">
              {/* First Column: CP and Pokémon Image */}
              <div className="pokemon-first-column">
                {item.cp && <CPDisplay cp={item.cp} />}
                {item.lucky && (
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

              {/* Second Column: Weight, Height, Moves, Location, and Date */}
              <div className="pokemon-second-column">
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
            <div className="pokemon-single-column">
              {item.cp && <CPDisplay cp={item.cp} />}
              {item.lucky && (
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

      {/* Right Column: Wanted List */}
      <div className="right-column">
        {item.wanted_list && (
          <div className="wanted-list-section">
            <h1>Wanted Pokémon:</h1>
            <div className="wanted-list">
              {Object.keys(item.wanted_list).map((pokemonKeyWithUUID) => {
                const { baseKey } = parsePokemonKey(pokemonKeyWithUUID);
                const wantedListPokemon = item.wanted_list[pokemonKeyWithUUID];
                const matchedPokemon = findPokemonByKey(baseKey);
                return matchedPokemon ? (
                  <img
                    key={pokemonKeyWithUUID}
                    src={matchedPokemon.currentImage}
                    alt={matchedPokemon.name}
                    className={`wanted-pokemon-image ${wantedListPokemon.match ? 'glowing-pokemon' : ''}`}
                    title={`${matchedPokemon.form ? `${matchedPokemon.form} ` : ''}${matchedPokemon.name}`}
                  />
                ) : null;
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

export default TradeListView;
