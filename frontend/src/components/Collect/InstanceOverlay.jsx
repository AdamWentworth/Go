// InstanceOverlay.jsx
import React from 'react';
import './InstanceOverlay.css';
import OwnedInstance from './InstanceOverlayComponents/OwnedInstance';
import TradeDetails from './InstanceOverlayComponents/TradeDetails';
import WindowOverlay from './WindowOverlay';  // Ensure WindowOverlay is imported correctly

const InstanceOverlay = ({ pokemon, onClose, ownershipFilter }) => {
  const handleOverlayClick = (event) => {
    if (!event.target.closest('.overlay-windows')) {
      onClose();
    }
  };

  const renderContent = () => {
    switch (ownershipFilter) {
      case 'Owned':
        return (
          <WindowOverlay onClose={onClose} className="owned-instance-window">
            <OwnedInstance pokemon={pokemon} />
          </WindowOverlay>
        );
      case 'Unowned':
        return <div>Unowned Instance Component</div>; // Placeholder for UnownedInstance component
      case 'Trade':
        return (
          <div className="trade-instance-overlay">
              <div className="overlay-row other-overlays-row">
              <WindowOverlay onClose={onClose} className="owned-instance-window">
                <OwnedInstance pokemon={pokemon} />
              </WindowOverlay>
              <WindowOverlay onClose={onClose} className="trade-details-window">
                <TradeDetails pokemon={pokemon} />
              </WindowOverlay>
            </div>
          </div>
        );
      case 'Wanted':
        return <div>Wanted Instance Component</div>; // Placeholder for WantedInstance component
      default:
        return null;
    }
  };

  return (
    <div className="instance-overlay" onClick={handleOverlayClick}>
          {renderContent()}
    </div>
  );
};

export default InstanceOverlay;
