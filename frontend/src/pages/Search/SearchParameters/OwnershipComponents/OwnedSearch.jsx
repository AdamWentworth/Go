// OwnedSearch.jsx
import React from 'react';
import IV from '../../../../components/pokemonComponents/IV.jsx';
import './OwnedSearch.css';

const OwnedSearch = ({ ivs, onIvChange, isHundo, setIsHundo }) => {
  // Pass changes directly via onIvChange.
  const handleChange = (newIvs) => {
    onIvChange(newIvs);
  };

  return (
    <div className="owned-options-container">
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

export default OwnedSearch;