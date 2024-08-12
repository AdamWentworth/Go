// ShadowInfo.jsx
import React from 'react';
import './ShadowInfo.css';
import { formatShinyShadowRarity, getLastWord } from '../utils/formattingHelpers';

function ShadowInfo({ pokemon, allPokemonData }) {
    // Function to extract the base name by slicing off everything before the last space
    const getBaseName = (name) => {
        return name.substring(name.lastIndexOf(' ') + 1);
    };

    // Apply the getBaseName function to pokemon.name
    const baseName = getBaseName(pokemon.name);

    // Check if the shiny shadow variant is available
    const showShinyShadow = pokemon.shadow_shiny_available === 1;

    // Helper function to find previous evolution's name and ID if needed
    const getPreviousEvolution = () => {
        if (pokemon.evolves_from) {
            const previousEvolution = allPokemonData.find(p => p.pokemon_id === pokemon.evolves_from[0]);
            return previousEvolution ? previousEvolution : null;
        }
        return null;
    };

    // Function to determine what text to display for shiny shadow rarity
    const displayShinyShadowRarity = () => {
        const defaultShinyShadowRarity = formatShinyShadowRarity(pokemon.shiny_shadow_rarity);
        const previousEvolution = getPreviousEvolution();

        // Check if the rarity is "Unavailable" but should be "Evolve {Previous form}"
        if (defaultShinyShadowRarity === 'Unavailable' && pokemon.evolves_from && previousEvolution) {
            return `Evolve ${getLastWord(previousEvolution.name)}`;
        }

        return defaultShinyShadowRarity;  // Return the default or formatted rarity
    }

    return (
      <div className="column shadow-info-column">
        <h1>Shadow {baseName}</h1>
  
        {/* New container for images */}
        <div className="images-container">
          <img src={pokemon.image_url_shadow} alt={`Shadow ${baseName}`} />
          {showShinyShadow && (
            <img src={pokemon.image_url_shiny_shadow} alt={`Shiny Shadow ${baseName}`} className="shiny-shadow-image" />
          )}
        </div>
        
        {/* Render shiny shadow rarity information */}
        {showShinyShadow && (
          <div className="shiny-rarity-info">
            <strong>Shiny Shadow Rarity:</strong> {
              // Replace newline characters with <br /> for proper rendering
              displayShinyShadowRarity().split('\n').map((line, index) => (
                <React.Fragment key={index}>
                  {line}
                  <br />
                </React.Fragment>
              ))
            }
          </div>
        )}
      </div>
    );
}

export default ShadowInfo;