// OwnedSearch.jsx
import React from 'react';
import IVSearch from '../OwnershipComponents/IVSearch';
import './OwnedSearch.css'; // Import the specific CSS for OwnedSearch

const OwnedSearch = ({ stats, onStatChange, isHundo, setIsHundo, isLucky, setIsLucky }) => {
  const handleHundoChange = () => {
    setIsHundo(!isHundo);
    if (!isHundo) {
      // If Hundo is checked, set all stats to 15
      onStatChange('attack', 15);
      onStatChange('defense', 15);
      onStatChange('stamina', 15);
    }
  };

  return (
    <div className="owned-options-container">
      {/* Single Column with Checkboxes and IVSearch */}
      <div className="options-column">
        {/* Checkboxes Row */}
        <div className="checkbox-row">
          <div className="field">
            <label>
              <input
                type="checkbox"
                checked={isHundo}
                onChange={handleHundoChange}
              />
              Hundo
            </label>
          </div>
          <div className="field">
            <label>
              <input
                type="checkbox"
                checked={isLucky}
                onChange={(e) => setIsLucky(e.target.checked)}
              />
              Lucky
            </label>
          </div>
        </div>

        {/* IVSearch takes the full width below the checkboxes */}
        <div className="iv-search-row">
          <IVSearch stats={stats} onStatChange={onStatChange} />
        </div>
      </div>
    </div>
  );
};

export default OwnedSearch;