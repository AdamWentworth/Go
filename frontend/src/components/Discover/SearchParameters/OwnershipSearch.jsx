// OwnershipSearch.jsx
import React from 'react';
import './OwnershipSearch.css'; // Import the CSS file for OwnershipSearch styling

const OwnershipSearch = ({ ownershipStatus, setOwnershipStatus }) => {
  const options = ['owned', 'trade', 'wanted']; // Define the options

  return (
    <div className="ownership-status">
      <h3 className="ownership-header">Ownership Status</h3>
      <div className="ownership-options">
        {options.map((option) => (
          <button
            key={option}
            className={`ownership-button ${ownershipStatus === option ? 'active ' + option : 'inactive ' + option}`}
            onClick={() => setOwnershipStatus(option)}
          >
            {option.charAt(0).toUpperCase() + option.slice(1)} {/* Capitalize first letter */}
          </button>
        ))}
      </div>
    </div>
  );
};

export default OwnershipSearch;
