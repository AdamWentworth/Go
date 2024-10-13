/* MainInfo.jsx */

import React from 'react';
import './MainInfo.css';

function MainInfo({ pokemon, isMale, toggleGender }) {
  const maleIcon = `/images/male-icon.png`;   // Male icon location
  const femaleIcon = `/images/female-icon.png`; // Female icon location

  // Function to extract the base name by slicing off everything before the last space
  const getBaseName = (name) => {
    return name.substring(name.lastIndexOf(' ') + 1);
  };

  // Function to calculate the width percentage of the stat gauge
  const calculateWidth = (stat, maxStat) => {
    return `${(stat / maxStat) * 100}%`;
  };

  const baseName = getBaseName(pokemon.name);

  return (
    <div className="column main-info-column">
      <div className="header-section">
        <h1>Main Info</h1>
        {pokemon.rarity.includes("Regional") && (
          <img 
            src="/images/regional.png" 
            alt="Regional" 
            className="regional-icon" 
            title="Regional"  // Tooltip for the Regional image
          />
        )}
      </div>
      
      <img 
        src={isMale ? pokemon.image_url : pokemon.female_data.image_url} 
        alt={baseName} 
        className="pokemon-image" 
      />
      <p>#{pokemon.pokedex_number}</p>
      {pokemon.female_data && (
        <img 
          src={isMale ? maleIcon : femaleIcon} 
          alt={isMale ? "Male" : "Female"} 
          onClick={toggleGender} 
          className="gender-toggle-icon" 
          role="button" 
          aria-label={`Toggle gender to ${isMale ? 'Female' : 'Male'}`}
          style={{ cursor: 'pointer' }}  // Add custom styling as necessary
        />
      )}
      <div className="type-section">
        <img src={pokemon.type_1_icon} alt={pokemon.type1_name} />
        {pokemon.type2_name && (
          <img src={pokemon.type_2_icon} alt={pokemon.type2_name} />
        )}
      </div>
      <h2>{baseName}</h2>

      <div className="stat-gauge">
        <div className="stat-text"><strong>Attack:</strong> {pokemon.attack}</div>
        <div className="gauge-container">
          <div className="gauge" style={{ width: calculateWidth(pokemon.attack, 400), backgroundColor: '#ae4c4c' }}></div>
        </div>
      </div>
      <div className="stat-gauge">
        <div className="stat-text"><strong>Defense:</strong> {pokemon.defense}</div>
        <div className="gauge-container">
          <div className="gauge" style={{ width: calculateWidth(pokemon.defense, 400), backgroundColor: '#4cae4f' }}></div>
        </div>
      </div>
      <div className="stat-gauge">
        <div className="stat-text"><strong>Stamina:</strong> {pokemon.stamina}</div>
        <div className="gauge-container">
          <div className="gauge" style={{ width: calculateWidth(pokemon.stamina, 400), backgroundColor: '#4c7aae' }}></div>
        </div>
      </div>

      <div className="cp">
        <strong>Level 40 Max CP:</strong> {pokemon.cp40}
      </div>
      <div className="cp">
        <strong>Level 50 Max CP:</strong> {pokemon.cp50}
      </div>
    </div>
  );
}

export default MainInfo;