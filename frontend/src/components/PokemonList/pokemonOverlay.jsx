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
      <button onClick={onClose} className="universal-close-button">X</button>
      {/* Render moves conditionally based on the total count */}
      {totalMoves > 15 ? (
        <>
          <div className="overlay-windows">
            <WindowOverlay onClose={onClose} position="fast-moves">
              <MoveList moves={fastMoves} />
            </WindowOverlay>
          </div>
          <div className="overlay-windows">
            <WindowOverlay onClose={onClose} position="charged-moves">
              <MoveList moves={chargedMoves} />
            </WindowOverlay>
          </div>
        </>
      ) : (
        <div className="overlay-windows">
          <WindowOverlay onClose={onClose} position="moves">
            <MoveList moves={pokemon.moves} />
          </WindowOverlay>
        </div>
      )}

      <div className="overlay-windows">
        <WindowOverlay onClose={onClose} position="main">
          <MainInfo pokemon={pokemon} />
        </WindowOverlay>
      </div>

      {showShinyWindow && (
        <div className="overlay-windows">
          <WindowOverlay onClose={onClose} position="shiny">
            <ShinyInfo pokemon={pokemon} />
          </WindowOverlay>
        </div>
      )}


      {showShadowWindow && (
        <div className="overlay-windows">
          <WindowOverlay onClose={onClose} position="shadow">
            <ShadowInfo pokemon={pokemon} />
          </WindowOverlay>
        </div>
      )}
      
      {showCostumesWindow && (
        <div className="overlay-windows">
          <WindowOverlay onClose={onClose} position="costumes">
            <Costumes costumes={pokemon.costumes} />
          </WindowOverlay>
        </div>
      )}
    </div>
  );
}

export default PokemonOverlay;
