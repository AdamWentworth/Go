// LocationPopup.jsx

import React from 'react';
import './LocationPopup.css'; // Ensure the CSS file is imported

const LocationPopup = ({ onConfirm, onCancel }) => {
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div className="popup-overlay" onClick={handleOverlayClick}>
      <div className="popup-content">
        <h2>Location Permission</h2>
        <p>May we use your current location to optimize location-based services?</p>
        <button onClick={onConfirm}>Yes</button>
        <button onClick={onCancel}>No</button>
      </div>
    </div>
  );
};

export default LocationPopup;
