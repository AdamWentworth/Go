import React, { useState } from 'react';
import './InstanceOverlay.css'; // Ensure this CSS provides similar styling as PokemonOverlay.css
import WindowOverlay from './OverlayComponents/windowOverlay';

const InstanceOverlay = ({ pokemon, onClose, setSelectedPokemon, allPokemons }) => {
  const [currentPokemon, setCurrentPokemon] = useState(pokemon);

  const handleOverlayClick = (event) => {
    if (!event.target.closest('.overlay-windows')) {
      onClose();
    }
  };

  return (
    <div className="pokemon-overlay" onClick={handleOverlayClick}>
      <button onClick={onClose} className="universal-close-button">X</button>

      <div className="overlay-content">
        <h1>Instance Details</h1>
        <p>Here will be the detailed view of the selected Pokemon instance.</p>
      </div>
    </div>
  );
}

export default InstanceOverlay;
