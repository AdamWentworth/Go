/* windowOverlay.jsx */

// WindowOverlay.jsx

import React from 'react';
import './WindowOverlay.css';

function WindowOverlay({ children, onClose, className }) {
  // Stop the propagation to prevent the click from reaching the pokemon-overlay
  const handleWindowClick = (event) => {
    event.stopPropagation();
  };

  return (
    <div className={`overlay-content ${className}`} onClick={handleWindowClick}>
      {children}
    </div>
  );
}

export default WindowOverlay;