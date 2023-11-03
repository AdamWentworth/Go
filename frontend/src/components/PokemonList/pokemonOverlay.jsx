import React, { useEffect } from 'react';
import './pokemonOverlay.css';
import { formatShinyRarity, formatCostumeName } from '../../utils/formattingHelpers';
import WindowOverlay from './OverlayComponents/windowOverlay'; // Import the new WindowOverlay component
import MoveList from './OverlayComponents/moveList'; // Import MoveList component

function PokemonOverlay({ pokemon, onClose }) {
  // Function to handle background clicks
  const handleBackgroundClick = (event) => {
    // If the click is on the background, not on a child, then close the overlay
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="pokemon-overlay" onClick={handleBackgroundClick}> {/* Add onClick here */}
      <div className="background"></div> {/* No onClick needed here anymore */}
      <div className="overlay-windows">
            <WindowOverlay onClose={onClose} position="moves">
                <MoveList moves={pokemon.moves} />
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
