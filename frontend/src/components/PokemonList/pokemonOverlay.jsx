// pokemonOverlay.jsx

import React from 'react';
import './pokemonOverlay.css';
import WindowOverlay from './OverlayComponents/windowOverlay';
import MoveList from './OverlayComponents/moveList';
import MainInfo from './OverlayComponents/mainInfo';
import ShinyInfo from './OverlayComponents/shinyInfo';
import Costumes from './OverlayComponents/costumes';
import ShadowInfo from './OverlayComponents/shadowInfo';


function PokemonOverlay({ pokemon, onClose }) {
  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const totalMoves = pokemon.moves.length;

  // Split moves into fast and charged for conditional rendering
  const fastMoves = pokemon.moves.filter(move => move.is_fast === 1);
  const chargedMoves = pokemon.moves.filter(move => move.is_fast === 0);

  // Convert `shiny_available` from integer to boolean for conditional rendering
  const showShinyWindow = pokemon.shiny_available === 1;
  const showCostumesWindow = Array.isArray(pokemon.costumes) && pokemon.costumes.length > 0;
  const showShadowWindow = pokemon.shadow_image != null;

  return (
    <div className="pokemon-overlay" onClick={handleOverlayClick}>
      <div className="overlay-windows">
        
        {/* Render moves conditionally based on the total count */}
        {totalMoves > 15 ? (
          <>
            <WindowOverlay onClose={onClose} position="fast-moves">
              <MoveList moves={fastMoves} />
            </WindowOverlay>
            <WindowOverlay onClose={onClose} position="charged-moves">
              <MoveList moves={chargedMoves} />
            </WindowOverlay>
          </>
        ) : (
          <WindowOverlay onClose={onClose} position="moves">
            <MoveList moves={pokemon.moves} />
          </WindowOverlay>
        )}

        <WindowOverlay onClose={onClose} position="main">
          <MainInfo pokemon={pokemon} />
        </WindowOverlay>
                
        {showShinyWindow && (
          <WindowOverlay onClose={onClose} position="shiny">
            <ShinyInfo pokemon={pokemon} />
          </WindowOverlay>
        )}

        {showShadowWindow && (
          <WindowOverlay onClose={onClose} position="shadow">
            <ShadowInfo pokemon={pokemon} />
          </WindowOverlay>
        )}

        {showCostumesWindow && (
          <WindowOverlay onClose={onClose} position="costumes">
            <Costumes costumes={pokemon.costumes} />
          </WindowOverlay>
        )}
      </div>
    </div>
  );
}

export default PokemonOverlay;
