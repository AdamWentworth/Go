// OwnedListView.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CP from '../../../../components/pokemonComponents/CP';
import MiniMap from './MiniMap';
import IV from '../../../../components/pokemonComponents/IV';
import MoveDisplay from '../../../../components/pokemonComponents/MoveDisplay';
import Gender from '../../../../components/pokemonComponents/Gender';
import { URLSelect } from '../../utils/URLSelect';
import getPokemonDisplayName from '../../utils/getPokemonDisplayName';
import ConfirmationOverlay from '../ConfirmationOverlay';
import './OwnedListView.css';

// Helper function to format date to YYYY-MM-DD
const formatDate = (dateString) => {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
};

const OwnedListView = ({ item }) => {
  const navigate = useNavigate();
  const imageUrl = URLSelect(item.pokemonInfo, item);
  const dynamax = item.dynamax;
  const gigantamax = item.gigantamax;
  const pokemonDisplayName = getPokemonDisplayName(item);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Show the confirmation overlay on center-column click
  const handleOpenConfirmation = () => {
    setShowConfirmation(true);
  };

  // Confirm navigation to the user's catalog
  const handleConfirmNavigation = () => {
    navigate(`/collection/${item.username}`, { state: { instanceId: item.instance_id, ownershipStatus: "Owned" } });
    setShowConfirmation(false);
  };

  // Close the confirmation overlay without navigating
  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
  };

  return (
    <div className="list-view-row">
      {/* Left Column: MiniMap */}
      <div className="left-column" onClick={(e) => e.stopPropagation()}>
        {item.distance > 0 && <p>Distance: {item.distance.toFixed(2)} km</p>}
        <MiniMap latitude={item.latitude} longitude={item.longitude} ownershipStatus="owned" />
      </div>

      {/* Center Column: Pokémon Image and Info */}
      <div className="center-column" onClick={handleOpenConfirmation}>
        <div className="card">
          <h3>{item.username}</h3>
          {item.cp > 0 && item.cp && <CP cp={item.cp} />}
          {item.pokemonInfo && (
            <div className="pokemon-image-container">
              {item.lucky && (
                <img
                  src={`${process.env.PUBLIC_URL}/images/lucky.png`}
                  alt="Lucky backdrop"
                  className="lucky-backdrop"
                />
              )}
              {imageUrl && <img src={imageUrl} alt={pokemonDisplayName} className="pokemon-image" />}
              {dynamax && (
                <img 
                  src={process.env.PUBLIC_URL + '/images/dynamax.png'} 
                  alt="Dynamax Badge" 
                  className="max-badge" 
                />
              )}
              {gigantamax && (
                <img 
                  src={process.env.PUBLIC_URL + '/images/gigantamax.png'} 
                  alt="Gigantamax Badge" 
                  className="max-badge" 
                />
              )}
              <p className="pokemon-name">
                {pokemonDisplayName}
                <Gender gender={item.gender} />
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Weight, Height, Moves, IVs, Location, Date */}
      <div className="right-column">
        <div className="weight-height-move-container">
          {item.weight > 0 && item.weight && (
            <div className="weight-height">
              <p><strong>{item.weight}kg</strong> WEIGHT</p>
            </div>
          )}
          <MoveDisplay
            fastMoveId={item.fast_move_id}
            chargedMove1Id={item.charged_move1_id}
            chargedMove2Id={item.charged_move2_id}
            moves={item.pokemonInfo.moves}
          />
          {item.height > 0 && item.height && (
            <div className="weight-height">
              <p><strong>{item.height}m</strong> HEIGHT</p>
            </div>
          )}
        </div>
        {/* Instead of passing the entire item, we pass just the IVs */}
        <IV ivs={{ 
          Attack: item.attack_iv, 
          Defense: item.defense_iv, 
          Stamina: item.stamina_iv 
        }} />

        {/* Location Caught */}
        {item.location_caught && (
          <div className="location-caught">
            <p><strong>Location Caught: </strong>{item.location_caught}</p>
          </div>
        )}

        {/* Date Caught (formatted) */}
        {item.date_caught && (
          <div className="date-caught">
            <p><strong>Date Caught: </strong>{formatDate(item.date_caught)}</p>
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

export default OwnedListView;