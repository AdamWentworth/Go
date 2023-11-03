/* mainInfo.jsx */

import React from 'react';
import './mainInfo.css'; // Now correctly pointing to the CSS file specific to MoveList

function MainInfo({ pokemon }) {
  return (
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
  );
}

export default MainInfo;
