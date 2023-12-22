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
  const showShadowWindow = pokemon.image_url_shadow != null;

  const switchOverlay = (newPokemonData) => {
    setCurrentPokemon(newPokemonData); // Update local state
    setSelectedPokemon(newPokemonData); // Propagate change to parent state
  };

  return (
    <div className="pokemon-overlay" onClick={handleOverlayClick}>
      <button onClick={onClose} className="universal-close-button">X</button>
  
      <div className="overlay-row evolution-shortcuts-row">
        {currentPokemon.evolves_from && (
          <WindowOverlay onClose={onClose} position="evolves-from" className="overlay-evolves-from">
            <EvolutionShortcut
              evolvesFrom={currentPokemon.evolves_from}
              allPokemonData={allPokemons}
              setSelectedPokemon={switchOverlay}
              className="evolution-shortcut-from"
            />
          </WindowOverlay>
        )}
  
        {currentPokemon.evolves_to && (
          <WindowOverlay onClose={onClose} position="evolves-to" className="overlay-evolves-to">
            <EvolutionShortcut
              evolvesTo={currentPokemon.evolves_to}
              allPokemonData={allPokemons}
              setSelectedPokemon={switchOverlay}
              className="evolution-shortcut-to"
            />
          </WindowOverlay>
        )}
      </div>
  
      <div className="overlay-row other-overlays-row">
        {totalMoves > 15 ? (
          <>
            <WindowOverlay onClose={onClose} position="fast-moves" className="overlay-fast-moves">
              <MoveList moves={fastMoves} className="move-list-fast" />
            </WindowOverlay>
            <WindowOverlay onClose={onClose} position="charged-moves" className="overlay-charged-moves">
              <MoveList moves={chargedMoves} className="move-list-charged" />
            </WindowOverlay>
          </>
        ) : (
          <WindowOverlay onClose={onClose} position="moves" className="overlay-all-moves">
            <MoveList moves={pokemon.moves} className="move-list-all" />
          </WindowOverlay>
        )}
  
        <WindowOverlay onClose={onClose} position="main" className="overlay-main-info">
          <MainInfo pokemon={pokemon} className="main-info" />
        </WindowOverlay>
  
        {showShinyWindow && (
          <WindowOverlay onClose={onClose} position="shiny" className="overlay-shiny-info">
            <ShinyInfo pokemon={pokemon} className="shiny-info" />
          </WindowOverlay>
        )}
  
        {showShadowWindow && (
          <WindowOverlay onClose={onClose} position="shadow" className="overlay-shadow-info">
            <ShadowInfo pokemon={pokemon} className="shadow-info" />
          </WindowOverlay>
        )}
        
        {showCostumesWindow && (
          <WindowOverlay onClose={onClose} position="costumes" className="overlay-costumes">
            <Costumes costumes={pokemon.costumes} className="costumes-info" />
          </WindowOverlay>
        )}
      </div>
    </div>
  );  
}

export default PokemonOverlay;
