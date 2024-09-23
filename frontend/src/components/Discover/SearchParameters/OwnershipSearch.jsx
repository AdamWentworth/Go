// OwnershipSearch.jsx

import React from 'react';
import './OwnershipSearch.css'; // Import the CSS file for OwnershipSearch styling

const OwnershipSearch = ({ ownershipStatus, setOwnershipStatus }) => {
  return (
    <div className="ownership-status">
      <h3 className="ownership-header">Ownership Status</h3>
      <div className="ownership-options">
        <label className="ownership-option">
          <input
            type="radio"
            value="owned"
            checked={ownershipStatus === 'owned'}
            onChange={() => setOwnershipStatus('owned')}
          />
          Owned
        </label>
        <label className="ownership-option">
          <input
            type="radio"
            value="trade"
            checked={ownershipStatus === 'trade'}
            onChange={() => setOwnershipStatus('trade')}
          />
          Trade
        </label>
        <label className="ownership-option">
          <input
            type="radio"
            value="wanted"
            checked={ownershipStatus === 'wanted'}
            onChange={() => setOwnershipStatus('wanted')}
          />
          Wanted
        </label>
      </div>
    </div>
  );
};

export default OwnershipSearch;
