// PokemonActionOverlay.jsx
import React from 'react';
import './PokemonActionOverlay.css';

const PokemonActionOverlay = ({
  isOpen,
  onClose,
  onViewWantedList,
  onProposeTrade,
  pokemon
}) => {
  if (!isOpen) return null;

  const handleActionClick = (action) => (e) => {
    e.stopPropagation(); // Prevent propagation of click events
    action();
    onClose(); // Close the overlay after the action
  };

  if (!pokemon) return null; // Ensure pokemon data is available

  return (
    <div className="pokemon-action-overlay" onClick={onClose}>
      <div className="overlay-content" onClick={(e) => e.stopPropagation()}>
        <img
          src={pokemon.currentImage}
          alt={pokemon.name}
          className="pokemon-action-image"
        />
        <h2>{pokemon.name}</h2>
        <p>What would you like to do with this Pokémon?</p>
        <div className="button-group">
          <button
            className="view-in-wanted"
            onClick={handleActionClick(onViewWantedList)}
          >
            View in Wanted List
          </button>
          <button
            className="propose-trade"
            onClick={handleActionClick(onProposeTrade)}
          >
            Propose a Trade
          </button>
        </div>
      </div>
    </div>
  );
};

export default PokemonActionOverlay;
