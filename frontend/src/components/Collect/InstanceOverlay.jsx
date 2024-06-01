// InstanceOverlay.jsx
import React from 'react';
import './InstanceOverlay.css';
import OwnedInstance from './InstanceComponents/OwnedInstance';

const InstanceOverlay = ({ pokemon, onClose, ownershipFilter }) => {
  const handleOverlayClick = (event) => {
    if (!event.target.closest('.overlay-content')) {
      onClose();
    }
  };

  const renderContent = () => {
    switch (ownershipFilter) {
      case 'Owned':
        return <OwnedInstance pokemon={pokemon} />;
      case 'Unowned':
        return <div>Unowned Instance Component</div>; // Placeholder for UnownedInstance component
      case 'Trade':
        return <div>Trade Instance Component</div>; // Placeholder for TradeInstance component
      case 'Wanted':
        return <div>Wanted Instance Component</div>; // Placeholder for WantedInstance component
      default:
        return null;
    }
  };

  return (
    <div className="instance-overlay" onClick={handleOverlayClick}>
      <div className="pokemon-overlay">
        <button onClick={onClose} className="universal-close-button">X</button>
        <div className="overlay-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default InstanceOverlay;
