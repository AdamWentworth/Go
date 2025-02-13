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
    e.stopPropagation();
    action();
    onClose();
  };

  if (!pokemon) return null;

  return (
    <div className="pokemon-action-overlay" onClick={onClose}>
      <div className="overlay-content" onClick={(e) => e.stopPropagation()}>
        {/* Image Container */}
        <div className="image-container">
          <img
            src={pokemon.currentImage}
            alt={pokemon.name}
            className="pokemon-action-image"
          />
          
          {/* Dynamax Icon */}
          {pokemon.variantType?.includes('dynamax') && (
            <img
              src={`${process.env.PUBLIC_URL}/images/dynamax.png`}
              alt="Dynamax"
              className="max-icon"
            />
          )}
          
          {/* Gigantamax Icon */}
          {pokemon.variantType?.includes('gigantamax') && (
            <img
              src={`${process.env.PUBLIC_URL}/images/gigantamax.png`}
              alt="Gigantamax"
              className="max-icon"
            />
          )}
        </div>

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