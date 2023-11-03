/* shinyInfo.jsx */

import React from 'react';
import './shinyInfo.css'; // You will create this CSS file in the next step
import { formatShinyRarity } from '../../../utils/formattingHelpers';

function ShinyInfo({ pokemon }) {
  return (
    <div className="column shiny-info-column">
      <h1>Shiny Info</h1>
      <img src={pokemon.shiny_image} alt={`${pokemon.name} Shiny`} />
      <div>
        <strong>Shiny Rarity:</strong> {formatShinyRarity(pokemon.shiny_rarity)}
      </div>
    </div>
  );
}

export default ShinyInfo;
