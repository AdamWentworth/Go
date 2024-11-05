// ConfirmationOverlay.jsx
import React from 'react';
import './ConfirmationOverlay.css';

const ConfirmationOverlay = ({ username, pokemonDisplayName, instanceId, onConfirm, onClose }) => {
  const handleYesClick = (e) => {
    e.stopPropagation();  // Ensure this does not propagate
    onConfirm();
    onClose();
  };

  const handleNoClick = (e) => {
    e.stopPropagation();  // Prevent propagation here too
    onClose();
  };

  return (
    <div className="confirmation-overlay" onClick={(e) => e.stopPropagation()}>
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