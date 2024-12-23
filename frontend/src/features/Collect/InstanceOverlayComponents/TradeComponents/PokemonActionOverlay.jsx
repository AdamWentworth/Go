// PokemonActionOverlay.jsx
import React from 'react';
import ReactDOM from 'react-dom';
import './PokemonActionOverlay.css';

const PokemonActionOverlay = ({ isOpen, onClose, onViewWantedList, onProposeTrade, pokemon, ownershipData }) => {
  if (!isOpen) return null;

  const handleActionClick = (action) => (e) => {
    e.stopPropagation(); // Prevent propagation of click events
    action();
    onClose(); // Close the overlay after the action
  };

  console.log(pokemon)

  // Create a portal to render the overlay at the end of the body
  return ReactDOM.createPortal(
    <div className="pokemon-action-overlay" onClick={onClose}>
      <div className="overlay-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button> 
        <img
        src={pokemon.currentImage}
        alt={pokemon.name}
        className="pokemon-action-image"
        />
        <h2>{pokemon?.name}</h2>
        <p>What would you like to do with this Pokémon?</p>
        <div className="button-group">
          <button className='view-in-wanted' onClick={handleActionClick(onViewWantedList)}>View in Wanted List</button>
          <button className='propose-trade' onClick={handleActionClick(onProposeTrade)}>Propose a Trade</button>
        </div>
      </div>
    </div>,
    document.body // Render the overlay at the end of the body
  );
};

export default PokemonActionOverlay;
