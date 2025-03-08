// OwnedSearch.jsx
import React from 'react';
import IV from '../../../../components/pokemonComponents/IV';
import './OwnedSearch.css';

const OwnedSearch = ({ stats, onStatChange, isHundo, setIsHundo }) => {
  // Wrap the onStatChange callback so that IV receives an object update.
  const handleChange = (newStats) => {
    // For each stat, call onStatChange with its value.
    Object.keys(newStats).forEach((stat) => {
      onStatChange(stat, newStats[stat]);
    });
  };

  return (
    <div className="owned-options-container">
      <div className="options-column">
        <IV
          mode="search"
          stats={stats}
          onChange={handleChange}
          isHundo={isHundo}
          setIsHundo={setIsHundo}
        />
      </div>
    </div>
  );
};

export default OwnedSearch;
