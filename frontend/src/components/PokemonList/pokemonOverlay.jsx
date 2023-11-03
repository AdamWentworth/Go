/* pokemonOverlay.jsx */

import React from 'react';
import './pokemonOverlay.css';
import WindowOverlay from './OverlayComponents/windowOverlay'; // Import the new WindowOverlay component
import MoveList from './OverlayComponents/moveList'; // Import MoveList component
import MainInfo from './OverlayComponents/mainInfo'; // Import the new MainInfo component
import ShinyInfo from './OverlayComponents/shinyInfo'; // Import the new ShinyInfo component
import Costumes from './OverlayComponents/costumes'; // Import the new Costumes component

function PokemonOverlay({ pokemon, onClose }) {
  // The handler is the same, it should work if the overlay-windows doesn't cover the whole pokemon-overlay
  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="pokemon-overlay" onClick={handleOverlayClick}>
      <div className="overlay-windows">
            <WindowOverlay onClose={onClose} position="moves">
                <MoveList moves={pokemon.moves} />
            </WindowOverlay>

            <WindowOverlay onClose={onClose} position="main">
              <MainInfo pokemon={pokemon} />
            </WindowOverlay>
                    
            <WindowOverlay onClose={onClose} position="shiny">
              <ShinyInfo pokemon={pokemon} /> {/* Use the new ShinyInfo component */}
            </WindowOverlay>

            {pokemon.costumes && pokemon.costumes.length > 0 && (
              <WindowOverlay onClose={onClose} position="costumes">
                <Costumes costumes={pokemon.costumes} /> {/* Use the new Costumes component */}
              </WindowOverlay>
            )}
        </div>
        </div>
    );
}

export default PokemonOverlay;
