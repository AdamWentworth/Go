// CaughtSearch.jsx
import React from 'react';
import IV from '../../../../components/pokemonComponents/IV.jsx';
import './CaughtSearch.css';

const CaughtSearch = ({ ivs, onIvChange, isHundo, setIsHundo }) => {
  // Pass changes directly via onIvChange.
  const handleChange = (newIvs) => {
    onIvChange(newIvs);
  };

  return (
    <div className="caught-options-container">
      <div className="options-column">
        <IV
          mode="search"
          ivs={ivs}
          onIvChange={handleChange}
          isHundo={isHundo}
          setIsHundo={setIsHundo}
        />
      </div>
    </div>
  );
};

export default CaughtSearch;
