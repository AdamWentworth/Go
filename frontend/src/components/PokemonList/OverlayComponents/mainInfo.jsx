/* mainInfo.jsx */

import React from 'react';
import './mainInfo.css';

function MainInfo({ pokemon }) {
  // Function to extract the base name by slicing off everything before the last space
  const getBaseName = (name) => {
    return name.substring(name.lastIndexOf(' ') + 1);
  };

  // Apply the getBaseName function to pokemon.name
  const baseName = getBaseName(pokemon.name);

  return (
    <div className="column main-info-column">
      <h1>Main Info</h1>
      <img src={pokemon.image_url} alt={baseName} /> {/* Adjust alt text to use baseName */}
      <p>#{pokemon.pokedex_number}</p>
      <div className="type-section">
        <img src={pokemon.type_1_icon} alt={pokemon.type1_name} />
        {pokemon.type2_name && (
          <img src={pokemon.type_2_icon} alt={pokemon.type2_name} />
        )}
      </div>
      <h2>{baseName}</h2> {/* Use baseName instead of pokemon.name */}

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

