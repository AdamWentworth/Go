// PokedexFilters.jsx

import React from 'react';
import './PokedexFilters.css'; // Adjust or add styles as needed

const PokedexFilters = ({
  isShiny,
  toggleShiny,
  showCostume,
  toggleCostume,
  showShadow,
  toggleShadow,
  toggleShowAll,
  showAll,
  isWide,
  // New callback from parent:
  onPokedexClick,
}) => {
  return (
    <div className={`pokedex-filters ${!isWide ? 'filter-overlay' : ''}`}>
      <div className="pokedex-text-container" onClick={onPokedexClick}>
        <span className="pokedex-text">POKEDEX</span>
      </div>
    </div>
  );
};

export default PokedexFilters;
