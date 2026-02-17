// PokemonActionOverlay.tsx
import React from 'react';
import './PokemonActionOverlay.css';
import type { SelectedPokemon } from './tradeDetailsHelpers';

interface PokemonActionOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onViewWantedList: () => void;
  onProposeTrade: () => void;
  pokemon?: SelectedPokemon | null;
}

const PokemonActionOverlay: React.FC<PokemonActionOverlayProps> = ({
  isOpen,
  onClose,
  onViewWantedList,
  onProposeTrade,
  pokemon,
}) => {
  if (!isOpen) return null;

  const handleActionClick = (action: () => void) => (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    action();
    onClose();
  };

  if (!pokemon) return null;
  const speciesName =
    (typeof pokemon.species_name === 'string' && pokemon.species_name) ||
    (typeof pokemon.name === 'string' && pokemon.name) ||
    '';
  const imageUrl =
    typeof pokemon.currentImage === 'string' ? pokemon.currentImage : undefined;
  const variantType =
    typeof pokemon.variantType === 'string' ? pokemon.variantType : '';

  return (
    <div className="pokemon-action-overlay" onClick={onClose}>
      <div className="overlay-content" onClick={(e) => e.stopPropagation()}>
        {/* Image Container */}
        <div className="image-container">
          {imageUrl && (
            <img
              src={imageUrl}
              alt={speciesName}
              className="pokemon-action-image"
            />
          )}
          
          {/* Dynamax Icon */}
          {variantType.includes('dynamax') && (
            <img
              src="/images/dynamax.png"
              alt="Dynamax"
              className="max-icon"
            />
          )}
          
          {/* Gigantamax Icon */}
          {variantType.includes('gigantamax') && (
            <img
              src="/images/gigantamax.png"
              alt="Gigantamax"
              className="max-icon"
            />
          )}
        </div>

        <h2>{speciesName}</h2>
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
