// InstanceOverlay.jsx
import React from 'react';
import './InstanceOverlay.css';
import OwnedInstance from './InstanceOverlayComponents/OwnedInstance';

import TradeInstance from './InstanceOverlayComponents/TradeInstance';
import TradeDetails from './InstanceOverlayComponents/TradeComponents/TradeDetails';

import WantedInstance from './InstanceOverlayComponents/WantedInstance';
import WantedDetails from './InstanceOverlayComponents/WantedComponents/WantedDetails';

import WindowOverlay from './WindowOverlay';  // Ensure WindowOverlay is imported correctly

const InstanceOverlay = ({ pokemon, onClose, ownershipFilter, lists, ownershipData }) => {

  console.log(lists)
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
              <WindowOverlay onClose={onClose} className="trade-instance-window">
                <TradeInstance pokemon={pokemon} />
              </WindowOverlay>
              <WindowOverlay onClose={onClose} className="trade-details-window">
                <TradeDetails pokemon={pokemon} lists={lists} ownershipData={ownershipData} />
              </WindowOverlay>
            </div>
          </div>
        );
      case 'Wanted':
        return (
          <div className="wanted-instance-overlay">
            <div className="overlay-row other-overlays-row">
              <WindowOverlay onClose={onClose} className="wanted-instance-window">
                <WantedInstance pokemon={pokemon} />
              </WindowOverlay>
              <WindowOverlay onClose={onClose} className="trade-details-window">
                <WantedDetails pokemon={pokemon} lists={lists} ownershipData={ownershipData} />
              </WindowOverlay>
            </div>
          </div>
        );
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
