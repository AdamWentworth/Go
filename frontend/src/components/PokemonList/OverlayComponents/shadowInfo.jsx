// ShadowInfo.jsx

import React from 'react';
import './shadowInfo.css'; // Ensure you have the corresponding CSS file

function ShadowInfo({ pokemon }) {
    // Check if the shiny shadow variant is available
    const showShinyShadow = pokemon.shadow_shiny_available === 1;
  
    return (
      <div className="column shadow-info-column">
        <h1>Shadow Info</h1>
  
        {/* New container for images */}
        <div className="images-container">
          <img src={pokemon.image_url_shadow} alt={`Shadow ${pokemon.name}`} />
          {showShinyShadow && (
            <img src={pokemon.image_url_shiny_shadow} alt={`Shiny Shadow ${pokemon.name}`} className="shiny-shadow-image" />
          )}
        </div>
  
        <strong>Shadow {pokemon.name}</strong>
      </div>
    );
  }

export default ShadowInfo;
