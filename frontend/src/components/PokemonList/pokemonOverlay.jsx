import React, { useState } from 'react';
import './pokemonOverlay.css';
import { formatShinyRarity, formatCostumeName } from '../../utils/formattingHelpers';

function WindowOverlay({ title, children, onClose, position }) {
    const handleBackgroundClick = (event) => {
        onClose();
    }

    const handleContentClick = (event) => {
        event.stopPropagation();
    }

    return (
        <div className={`pokemon-overlay ${position}`} onClick={handleBackgroundClick}>
            <div className="overlay-content" onClick={handleContentClick}>
                <button onClick={onClose} className="close-button">X</button>
                {children}
            </div>
        </div>
    );
}

function getTypeIconPath(typeName) {
  // Now using type's name to construct the image path, as per your backend changes
  return `/images/types/${typeName.toLowerCase()}.png`;
}

function PokemonOverlay({ pokemon, onClose }) {
  const fastAttacks = pokemon.moves.filter(move => move.is_fast === 1);
  const chargedAttacks = pokemon.moves.filter(move => move.is_fast === 0);

  return (
      <div className="pokemon-overlay" onClick={onClose}>
          <div className="background"></div>
          <div className="overlay-windows">
          <WindowOverlay onClose={onClose} position="moves">
                  <div className="column moves-column">
                      <h1>Moves</h1>
                      <h2>Fast Attacks</h2>
                      <ul>
                          {fastAttacks.map((move) => (
                              <li key={`fast-${move.move_id}`}>
                                  <img className="type-icon" src={getTypeIconPath(move.type_name)} alt={`${move.type_name} type`} />
                                  {move.name}
                              </li>
                          ))}
                      </ul>
                      <h2>Charged Attacks</h2>
                      <ul>
                          {chargedAttacks.map((move) => (
                              <li key={`charged-${move.move_id}`}>
                                  <img className="type-icon" src={getTypeIconPath(move.type_name)} alt={`${move.type_name} type`} />
                                  {move.name}
                              </li>
                          ))}
                      </ul>
                  </div>
              </WindowOverlay>

                    <WindowOverlay onClose={onClose} position="main">
                        <div className="column main-info-column">
                        <h1>Main Info</h1>
                        <img src={pokemon.currentImage} alt={pokemon.name} />
                        <p>#{pokemon.pokedex_number}</p>
                        <div className="type-section"> 
                            <img src={pokemon.type_1_icon} alt={pokemon.type1_name} />
                            {pokemon.type2_name && (
                                <img src={pokemon.type_2_icon} alt={pokemon.type2_name} />
                            )}
                        </div>
                        <h2>{pokemon.name}</h2>

                        <div>
                            <strong>Attack:</strong> {pokemon.attack}
                        </div>
                        <div>
                            <strong>Defense:</strong> {pokemon.defense}
                        </div>
                        <div>
                            <strong>Stamina:</strong> {pokemon.stamina}
                        </div>
                    </div>

                    </WindowOverlay>
                    
                    <WindowOverlay onClose={onClose} position="shiny">
                        <div className="column images-column">
                            <h1>Shiny Info</h1>
                        <img src={pokemon.shiny_image} alt={`${pokemon.name} Shiny`} />
                        <div>
                            <strong>Shiny Rarity:</strong> {formatShinyRarity(pokemon.shiny_rarity)}
                        </div>
                    </div>

                    </WindowOverlay>

                {pokemon.costumes && pokemon.costumes.length > 0 && (
                    <WindowOverlay onClose={onClose} position="costumes">
                        <div className="column costume-column">
                        <h1>Costumes</h1>
                    <ul>
                        {pokemon.costumes.map((costume, index) => (
                            <li key={index}>
                                <div className="costume-images">
                                    <img src={costume.image} alt={`Costume - ${formatCostumeName(costume.name)}`} />
                                    {costume.shiny_available === 1 && (
                                        <img src={costume.shiny_image} alt={`Shiny Costume - ${formatCostumeName(costume.name)}`} />
                                    )}
                                </div>
                                {formatCostumeName(costume.name)}
                            </li>
                        ))}
                    </ul>
                    </div>  
                    </WindowOverlay>
            )}
        </div>
        </div>
    );
}

export default PokemonOverlay;
