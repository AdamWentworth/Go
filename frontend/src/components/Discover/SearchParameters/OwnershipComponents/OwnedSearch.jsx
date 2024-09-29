// OwnedSearch.jsx
import React from 'react';
import IVSearch from '../OwnershipComponents/IVSearch';
import './OwnedSearch.css'; // Import the specific CSS for OwnedSearch

const OwnedSearch = ({ stats, onStatChange, isHundo, setIsHundo }) => {
  const handleHundoChange = () => {
    const newIsHundo = !isHundo;
    setIsHundo(newIsHundo);
    if (newIsHundo) {
      // If Hundo is checked, set all stats to 15
      onStatChange('attack', 15);
      onStatChange('defense', 15);
      onStatChange('stamina', 15);
    }
    // If Hundo is unchecked, leave stats as is
  };

  return (
    <div className="owned-options-container">
      {/* Single Column with Checkboxes and IVSearch */}
      <div className="options-column">
        {/* Checkboxes Row */}
        <div className="checkbox-row">
          <div className="field hundo-field">
            <label>
              <input
                type="checkbox"
                checked={isHundo}
                onChange={handleHundoChange}
              />
              Hundo
            </label>
          </div>
        </div>

        {/* IVSearch takes the full width below the checkboxes */}
        <div className="iv-search-row">
          <IVSearch
            stats={stats}
            onStatChange={onStatChange}
            isHundo={isHundo} // Pass isHundo to IVSearch
          />
        </div>
      </div>
    </div>
  );
};

export default OwnedSearch;