/* shinyInfo.jsx */

import React from 'react';
import './shinyInfo.css'; 
import { formatShinyRarity } from '../utils/formattingHelpers';

function ShinyInfo({ pokemon }) {
  return (
    <div className="column shiny-info-column">
      <h1>Shiny Info</h1>
      <img src={pokemon.image_url_shiny} alt={`${pokemon.name} Shiny`} />
      <div>
        <strong>Shiny Rarity:</strong> {formatShinyRarity(pokemon.shiny_rarity)}
      </div>
    </div>
  );
}

export default ShinyInfo;
