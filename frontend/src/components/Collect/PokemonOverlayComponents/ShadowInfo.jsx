// ShadowInfo.jsx

import React from 'react';
import './ShadowInfo.css';

function ShadowInfo({ pokemon }) {
    // Function to extract the base name by slicing off everything before the last space
    const getBaseName = (name) => {
        return name.substring(name.lastIndexOf(' ') + 1);
    };

    // Apply the getBaseName function to pokemon.name
    const baseName = getBaseName(pokemon.name);

    // Check if the shiny shadow variant is available
    const showShinyShadow = pokemon.shadow_shiny_available === 1;
  
    return (
      <div className="column shadow-info-column">
        <h1>Shadow Info</h1>
  
        {/* New container for images */}
        <div className="images-container">
          <img src={pokemon.image_url_shadow} alt={`Shadow ${baseName}`} />
          {showShinyShadow && (
            <img src={pokemon.image_url_shiny_shadow} alt={`Shiny Shadow ${baseName}`} className="shiny-shadow-image" />
          )}
        </div>
  
        <strong>Shadow {baseName}</strong> {/* Use baseName instead of full pokemon.name */}
      </div>
    );
  }

export default ShadowInfo;
