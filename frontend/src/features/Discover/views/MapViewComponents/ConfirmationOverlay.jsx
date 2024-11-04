// ConfirmationOverlay.jsx

import React from 'react';
import './ConfirmationOverlay.css';

const ConfirmationOverlay = ({ username, pokemonDisplayName, instanceId, onConfirm, onClose }) => {
  const handleYesClick = () => {
    onConfirm(); // Call the confirm handler passed in as a prop
    onClose();
  };

  const handleNoClick = () => {
    onClose();
  };

  return (
    <div className="confirmation-overlay">
      <div className="confirmation-content">
        <p>Would you like to see {username}'s {pokemonDisplayName} in their catalog?</p>
        <div className="confirmation-buttons">
          <button onClick={handleYesClick}>Yes</button>
          <button onClick={handleNoClick}>No</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationOverlay;
