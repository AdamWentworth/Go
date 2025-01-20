// FuseOverlay.jsx
import React from 'react';
import OwnedInstance from '../OwnedInstance'; // Adjust the path as needed
import './FuseOverlay.css';

const FuseOverlay = ({ pokemon, onClose, onFuse }) => {
  const handleFuse = () => {
    console.log('Fuse button clicked for', pokemon);
    if (onFuse) onFuse();
  };

  return (
    <div className="fuse-overlay">
      <div className="overlay-content">
        <OwnedInstance pokemon={pokemon} isEditable={false} />
        <button onClick={handleFuse} className="fuse-button">Fuse</button>
        <button onClick={onClose} className="close-overlay">Close</button>
      </div>
    </div>
  );
};

export default FuseOverlay;
