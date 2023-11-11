// pokemonOverlay.jsx

import React, { useState } from 'react';
import './pokemonOverlay.css';
import WindowOverlay from './OverlayComponents/windowOverlay';
import MoveList from './OverlayComponents/moveList';
import MainInfo from './OverlayComponents/mainInfo';
import ShinyInfo from './OverlayComponents/shinyInfo';
import Costumes from './OverlayComponents/costumes';
import ShadowInfo from './OverlayComponents/shadowInfo';
import EvolutionShortcut from './OverlayComponents/evolutionShortcut';

const PokemonOverlay = ({ pokemon, onClose, setSelectedPokemon, allPokemons }) => {
  const [currentPokemon, setCurrentPokemon] = useState(pokemon);
  const handleOverlayClick = (event) => {
    if (!event.target.closest('.overlay-windows')) {
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

  const switchOverlay = (newPokemonData) => {
    setCurrentPokemon(newPokemonData); // Update local state
    setSelectedPokemon(newPokemonData); // Propagate change to parent state
  };

  return (
    <div className="pokemon-overlay" onClick={handleOverlayClick}>
      <button onClick={onClose} className="universal-close-button">X</button>

      {/* Evolution Shortcuts split into separate windows */}
      <div className="overlay-row evolution-shortcuts-row">
        {/* Window for Evolves From - Only render if evolves_from data exists */}
        {currentPokemon.evolves_from && (
          <WindowOverlay onClose={onClose} position="evolves-from">
            <EvolutionShortcut
              evolvesFrom={currentPokemon.evolves_from}
              allPokemonData={allPokemons}
              setSelectedPokemon={switchOverlay}
            />
          </WindowOverlay>
        )}

        {/* Window for Evolves To - Only render if evolves_to data exists */}
        {currentPokemon.evolves_to && (
          <WindowOverlay onClose={onClose} position="evolves-to">
            <EvolutionShortcut
              evolvesTo={currentPokemon.evolves_to}
              allPokemonData={allPokemons}
              setSelectedPokemon={switchOverlay}
            />
          </WindowOverlay>
        )}
      </div>

      {/* Second Row: Other Overlay Windows */}
      <div className="overlay-row other-overlays-row">
        {/* Render moves conditionally */}
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
