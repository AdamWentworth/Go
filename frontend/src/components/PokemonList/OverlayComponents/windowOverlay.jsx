/* windowOverlay.jsx */

import React from 'react';
import './windowOverlay.css';

function WindowOverlay({ children, onClose, position }) {
  // Stop the propagation to prevent the click from reaching the pokemon-overlay
  const handleWindowClick = (event) => {
    event.stopPropagation();
  };

  // Function to determine the order based on position
  const getOrder = (position) => {
    switch (position) {
      case 'main':
        return 2;
      case 'shiny':
        return 3;
      case 'moves':
        return 1;
      case 'costumes':
        return 4;
      case 'shadow':
        return 5
      default:
        return 0;
    }
  };

  return (
    <div className={`overlay-content overlay-${position}`} onClick={handleWindowClick} style={{ order: getOrder(position) }}>
      {children}
    </div>
  );
}

export default WindowOverlay;
