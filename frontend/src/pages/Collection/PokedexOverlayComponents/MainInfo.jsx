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

  // Helper function for dynamic rounding. 
  // This uses toPrecision to eliminate floating‑point imprecision while preserving significant digits.
  const formatNumber = (num) => {
    if (typeof num !== 'number') return num;
    return parseFloat(num.toPrecision(12));
  };

  const baseName = pokemon.variantType.includes("mega")
    ? pokemon.name
    : getBaseName(pokemon.name);

  return (
    <div className="column main-info-column">
      <div className="header-section">
        <h1>Main Info</h1>
        {pokemon.rarity && pokemon.rarity.includes("Regional") && (
          <img 
            src="/images/regional.png" 
            alt="Regional" 
            className="regional-icon" 
            title="Regional" 
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
          style={{ cursor: 'pointer' }} 
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
          <div 
            className="gauge" 
            style={{ width: calculateWidth(pokemon.attack, 450), backgroundColor: '#ae4c4c' }}
          ></div>
        </div>
      </div>
      <div className="stat-gauge">
        <div className="stat-text"><strong>Defense:</strong> {pokemon.defense}</div>
        <div className="gauge-container">
          <div 
            className="gauge" 
            style={{ width: calculateWidth(pokemon.defense, 400), backgroundColor: '#4cae4f' }}
          ></div>
        </div>
      </div>
      <div className="stat-gauge">
        <div className="stat-text"><strong>Stamina:</strong> {pokemon.stamina}</div>
        <div className="gauge-container">
          <div 
            className="gauge" 
            style={{ width: calculateWidth(pokemon.stamina, 500), backgroundColor: '#4c7aae' }}
          ></div>
        </div>
      </div>

      <div className="cp">
        <strong>Level 40 Max CP:</strong> {pokemon.cp40}
      </div>
      <div className="cp">
        <strong>Level 50 Max CP:</strong> {pokemon.cp50}
      </div>

      {pokemon.sizes && (
        <div className="sizes-section">
          <div className="size-details">
            {/* Weights on the left */}
            <div className="weight-ranges">
              <h3>Weight</h3>
              <ul>
                <li><strong>Average:</strong> {formatNumber(pokemon.sizes.pokedex_weight)} kg</li>
                <li><strong>XXS:</strong> &lt; {formatNumber(pokemon.sizes.weight_xxs_threshold)} kg</li>
                <li><strong>XS:</strong> &lt; {formatNumber(pokemon.sizes.weight_xs_threshold)} kg</li>
                <li><strong>XL:</strong> &gt; {formatNumber(pokemon.sizes.weight_xl_threshold)} kg</li>
                <li><strong>XXL:</strong> &gt; {formatNumber(pokemon.sizes.weight_xxl_threshold)} kg</li>
              </ul>
            </div>
            {/* Heights on the right */}
            <div className="height-ranges">
              <h3>Height</h3>
              <ul>
                <li><strong>Average:</strong> {formatNumber(pokemon.sizes.pokedex_height)} m</li>
                <li><strong>XXS:</strong> &lt; {formatNumber(pokemon.sizes.height_xxs_threshold)} m</li>
                <li><strong>XS:</strong> &lt; {formatNumber(pokemon.sizes.height_xs_threshold)} m</li>
                <li><strong>XL:</strong> &gt; {formatNumber(pokemon.sizes.height_xl_threshold)} m</li>
                <li><strong>XXL:</strong> &gt; {formatNumber(pokemon.sizes.height_xxl_threshold)} m</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MainInfo;