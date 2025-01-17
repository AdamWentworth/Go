// PokedexOverlay.jsx

import React, { useState, useEffect } from 'react';
import './PokedexOverlay.css';
import WindowOverlay from './WindowOverlay';
import MoveList from './PokedexOverlayComponents/MoveList';
import MainInfo from './PokedexOverlayComponents/MainInfo';
import ShinyInfo from './PokedexOverlayComponents/ShinyInfo';
import Costumes from './PokedexOverlayComponents/Costumes';
import ShadowInfo from './PokedexOverlayComponents/ShadowInfo';
import EvolutionShortcut from './PokedexOverlayComponents/EvolutionShortcut';
import CloseButton from '../../components/CloseButton';

const useScreenWidth = () => {
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return screenWidth;
};

const PokemonOverlay = ({ pokemon, onClose, setSelectedPokemon, allPokemons }) => {
  const [currentPokemon, setCurrentPokemon] = useState(pokemon);
  const [isMale, setIsMale] = useState(true); // Gender state, default is male
  const screenWidth = useScreenWidth();
  const isWidescreen = screenWidth >= 1440;
  const isMediumScreen = screenWidth >= 1024 && screenWidth < 1440;
  const isNarrowScreen = screenWidth < 1024;

  // Toggle gender state between male and female
  const toggleGender = () => {
    setIsMale((prevIsMale) => !prevIsMale);
  };

  const handleOverlayClick = (event) => {
    if (!event.target.closest('.overlay-windows')) {
      onClose();
    }
  };

  const totalMoves = pokemon.moves.length;
  const fastMoves = pokemon.moves.filter(move => move.is_fast === 1);
  const chargedMoves = pokemon.moves.filter(move => move.is_fast === 0);
  const showShinyWindow = pokemon.shiny_available === 1;
  const isMega = pokemon.variantType && pokemon.variantType.includes("mega"); // Check if the Pokémon is a mega variant
  const isPrimal = pokemon.variantType && pokemon.variantType.includes("primal"); // Check if the Pokémon is a mega variant
  const isFusion = pokemon.variantType && pokemon.variantType.includes("fusion"); // Check if the Pokémon is a fusion pokemon
  const showCostumesWindow = !isMega && Array.isArray(pokemon.costumes) && pokemon.costumes.length > 0; // Only show costumes if not mega
  const showShadowWindow = !isMega && !isPrimal && pokemon.date_shadow_available && pokemon.date_shadow_available.trim() !== '';

  const switchOverlay = (newPokemonData) => {
    setCurrentPokemon(newPokemonData);
    setSelectedPokemon(newPokemonData);
  };

  const renderCloseButton = () => (
    <div className="close-button-container">
      <CloseButton onClick={onClose} />
    </div>
  );

  const renderMoves = () => (
    totalMoves > 15 ? (
      <>
        <WindowOverlay onClose={onClose} className="overlay-fast-moves">
          <MoveList 
          moves={fastMoves} 
          className="move-list-fast"
          pokemon={pokemon} />
        </WindowOverlay>
        <WindowOverlay onClose={onClose} className="overlay-charged-moves">
          <MoveList 
          moves={chargedMoves} 
          className="move-list-charged"
          pokemon={pokemon} />
        </WindowOverlay>
      </>
    ) : (
      <WindowOverlay onClose={onClose} className="overlay-all-moves">
        <MoveList 
        moves={pokemon.moves} 
        className="move-list-all"
        pokemon={pokemon} />
      </WindowOverlay>
    )
  );

  function renderMediumScreenLayout() {
    const hasFewCostumes = pokemon.costumes && pokemon.costumes.length <= 2;
    const hasNoCostumes = pokemon.costumes.length == 0;

    return (
      <div className="overlay-row other-overlays-row">
        {renderMoves()}
        <div className="column main-info-column">
          <WindowOverlay onClose={onClose} className="overlay-main-info">
            <MainInfo
              pokemon={pokemon}
              className="main-info"
              isMale={isMale} // Pass the gender state to MainInfo
              toggleGender={toggleGender} // Pass the toggle function to MainInfo
            />
          </WindowOverlay>
          {(hasFewCostumes && showShadowWindow && !hasNoCostumes) && (
            <WindowOverlay onClose={onClose} className="overlay-shadow-info">
              <ShadowInfo pokemon={pokemon} allPokemonData={allPokemons} isMale={isMale} />
            </WindowOverlay>          
          )}
        </div>
        {hasFewCostumes ? (
          <div className="column third-column">
            {showShinyWindow && (
              <WindowOverlay onClose={onClose} className="overlay-shiny-info">
                <ShinyInfo pokemon={currentPokemon} allPokemonData={allPokemons} isMale={isMale} />
              </WindowOverlay>            
            )}
            {(showShadowWindow && hasNoCostumes) && (
              <WindowOverlay onClose={onClose} className="overlay-shadow-info">
                <ShadowInfo pokemon={pokemon} allPokemonData={allPokemons} isMale={isMale} />
              </WindowOverlay>            
            )}
            {showCostumesWindow && (
              <WindowOverlay onClose={onClose} className="overlay-costumes">
                <Costumes costumes={pokemon.costumes} isMale={isMale} className="costumes-info" />
              </WindowOverlay>            
            )}
          </div>
        ) : (
          <>
            <div className="column third-column">
              {showShinyWindow && (
                <WindowOverlay onClose={onClose} className="overlay-shiny-info">
                  <ShinyInfo pokemon={currentPokemon} allPokemonData={allPokemons} isMale={isMale} />
                </WindowOverlay>              
              )}
              {showShadowWindow && (
                <WindowOverlay onClose={onClose} className="overlay-shadow-info">
                  <ShadowInfo pokemon={pokemon} allPokemonData={allPokemons} isMale={isMale} />
                </WindowOverlay>              
              )}
            </div>
            <div className="column fourth-column">
              {showCostumesWindow && (
                <WindowOverlay onClose={onClose} className="overlay-costumes">
                  <Costumes costumes={pokemon.costumes} isMale={isMale} className="costumes-info" />
                </WindowOverlay>              
              )}
            </div>
          </>
        )}
      </div>
    );
  }  

  function renderWidescreenLayout() {
    return (
      <div className="overlay-row other-overlays-row">
        {renderMoves()}

        <WindowOverlay onClose={onClose} className="overlay-main-info">
          <MainInfo
            pokemon={pokemon}
            className="main-info"
            isMale={isMale} // Pass the gender state to MainInfo
            toggleGender={toggleGender} // Pass the toggle function to MainInfo
          />
        </WindowOverlay>

        {showShinyWindow && (
          <WindowOverlay onClose={onClose} className="overlay-shiny-info">
            <ShinyInfo pokemon={currentPokemon} allPokemonData={allPokemons} isMale={isMale} />
          </WindowOverlay>        
        )}

        {showShadowWindow && (
          <WindowOverlay onClose={onClose} className="overlay-shadow-info">
            <ShadowInfo pokemon={pokemon} allPokemonData={allPokemons} isMale={isMale} />
          </WindowOverlay>        
        )}

        {showCostumesWindow && (
          <WindowOverlay onClose={onClose} className="overlay-costumes">
            <Costumes costumes={pokemon.costumes} isMale={isMale} className="costumes-info" />
          </WindowOverlay>        
        )}
      </div>
    );
  }  

  function renderNarrowScreenLayout() {
    return (
      <div className="overlay-row other-overlays-row column-layout">
        <WindowOverlay onClose={onClose} className="overlay-main-info">
          <MainInfo
            pokemon={pokemon}
            className="main-info"
            isMale={isMale} // Pass the gender state to MainInfo
            toggleGender={toggleGender} // Pass the toggle function to MainInfo
          />
        </WindowOverlay>

        {showShinyWindow && (
          <WindowOverlay onClose={onClose} className="overlay-shiny-info">
            <ShinyInfo pokemon={currentPokemon} allPokemonData={allPokemons} isMale={isMale} />
          </WindowOverlay>        
        )}

        {showShadowWindow && (
          <WindowOverlay onClose={onClose} className="overlay-shadow-info">
            <ShadowInfo pokemon={pokemon} allPokemonData={allPokemons} isMale={isMale} />
          </WindowOverlay>        
        )}

        {showCostumesWindow && (
          <WindowOverlay onClose={onClose} className="overlay-costumes">
            <Costumes costumes={pokemon.costumes} isMale={isMale} className="costumes-info" />
          </WindowOverlay>
        )}

        {renderMoves()}
      </div>
    );
  }  

  return (
    <div className="pokemon-overlay" onClick={handleOverlayClick}>
      {renderCloseButton()}

      <div className={`overlay-row evolution-shortcuts-row ${isWidescreen ? '' : 'column-layout'}`}>
        {/* Evolution shortcuts */}
        {currentPokemon.evolves_from && (
          <WindowOverlay onClose={onClose} className="overlay-evolves-from">
            <EvolutionShortcut
              evolvesFrom={currentPokemon.evolves_from}
              allPokemonData={allPokemons}
              currentPokemon={currentPokemon}
              setSelectedPokemon={switchOverlay}
              className="evolution-shortcut-from"
            />
          </WindowOverlay>
        )}

        {currentPokemon.evolves_to && (
          <WindowOverlay onClose={onClose} className="overlay-evolves-to">
            <EvolutionShortcut
              evolvesTo={currentPokemon.evolves_to}
              allPokemonData={allPokemons}
              currentPokemon={currentPokemon}
              setSelectedPokemon={switchOverlay}
              className="evolution-shortcut-to"
            />
          </WindowOverlay>
        )}
        {currentPokemon.megaEvolutions && currentPokemon.megaEvolutions.length > 0 && !isMega &&!isPrimal && (
          <WindowOverlay onClose={onClose} className="overlay-mega-evolutions">
            <EvolutionShortcut
              megaEvolutions={currentPokemon.megaEvolutions}
              allPokemonData={allPokemons}
              currentPokemon={currentPokemon}
              setSelectedPokemon={switchOverlay}
              className="evolution-shortcut-mega"
            />
          </WindowOverlay>
          
        )}
        {currentPokemon.megaEvolutions && currentPokemon.megaEvolutions.length > 0 && (isMega || isPrimal) && (
          <WindowOverlay onClose={onClose} className="overlay-evolves-from">
            <EvolutionShortcut
              megaEvolutions={currentPokemon.megaEvolutions}
              allPokemonData={allPokemons}
              currentPokemon={currentPokemon}
              setSelectedPokemon={switchOverlay}
              className="evolution-shortcut-mega"
            />
          </WindowOverlay> 
        )}
      </div>

      {currentPokemon.fusion && currentPokemon.fusion.length > 0 && !isFusion && (
        <WindowOverlay onClose={onClose} className="overlay-evolves-to">
          <EvolutionShortcut
            fusionEvolutions={currentPokemon.fusion}
            allPokemonData={allPokemons}
            currentPokemon={currentPokemon}
            setSelectedPokemon={switchOverlay}
            className="evolution-shortcut-fusion"
          />
        </WindowOverlay>
      )}

      {currentPokemon.fusion && currentPokemon.fusion.length > 0 && isFusion && (
        <WindowOverlay onClose={onClose} className="overlay-evolves-from">
          <EvolutionShortcut
            fusionEvolutions={currentPokemon.fusion}
            allPokemonData={allPokemons}
            currentPokemon={currentPokemon}
            setSelectedPokemon={switchOverlay}
            className="evolution-shortcut-fusion"
          />
        </WindowOverlay>
      )}

      {isMediumScreen && (
        <div>
          {/* Medium screen layout */}
          {renderMediumScreenLayout()}
        </div>
      )}

      {isWidescreen && !isMediumScreen && (
        <div>
          {/* Wide screen layout */}
          {renderWidescreenLayout()}
        </div>
      )}

      {isNarrowScreen && (
        <div>
          {/* Narrow screen layout */}
          {renderNarrowScreenLayout()}
        </div>
      )}
    </div>
  );
};

export default PokemonOverlay;
