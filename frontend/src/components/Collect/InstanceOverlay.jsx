// InstanceOverlay.jsx
import React, { useState } from 'react';
import './InstanceOverlay.css';
import OwnedInstance from './InstanceOverlayComponents/OwnedInstance';

import TradeInstance from './InstanceOverlayComponents/TradeInstance';
import TradeDetails from './InstanceOverlayComponents/TradeComponents/TradeDetails';

import WantedInstance from './InstanceOverlayComponents/WantedInstance';
import WantedDetails from './InstanceOverlayComponents/WantedComponents/WantedDetails';

import WindowOverlay from './WindowOverlay';  // Ensure WindowOverlay is imported correctly

const InstanceOverlay = ({ pokemon, onClose, variants, ownershipFilter, lists, ownershipData, sortType, sortMode }) => {
  const [currentOverlay, setCurrentOverlay] = useState(ownershipFilter);
  const [selectedPokemon, setSelectedPokemon] = useState(pokemon);
  // console.log(variants)
  const handleOverlayClick = (event) => {
    if (!event.target.closest('.overlay-windows')) {
      onClose();
    }
  };

  const handleOpenWantedOverlay = (pokemonData) => {
    // console.log('Opening Wanted Overlay with data:', pokemonData);
    setSelectedPokemon(pokemonData);
    setCurrentOverlay('Wanted');
  };

  const handleCloseOverlay = () => {
    onClose();
    setCurrentOverlay(ownershipFilter);
    setSelectedPokemon(null);
  };

  const renderContent = () => {
    switch (currentOverlay) {
      case 'Owned':
        return (
          <WindowOverlay onClose={handleCloseOverlay} className="owned-instance-window">
            <OwnedInstance pokemon={selectedPokemon} />
          </WindowOverlay>
        );
      case 'Unowned':
        return <div>Unowned Instance Component</div>; // Placeholder for UnownedInstance component
      case 'Trade':
        return (
          <div className="trade-instance-overlay">
            <div className="overlay-row other-overlays-row">
              <WindowOverlay onClose={handleCloseOverlay} className="trade-instance-window">
                <TradeInstance pokemon={selectedPokemon} />
              </WindowOverlay>
              <WindowOverlay onClose={handleCloseOverlay} className="trade-details-window">
                <TradeDetails
                  pokemon={selectedPokemon}
                  lists={lists}
                  ownershipData={ownershipData}
                  sortType={sortType}
                  sortMode={sortMode}
                  onClose={handleCloseOverlay}
                  openWantedOverlay={handleOpenWantedOverlay}
                  variants={variants}
                />
              </WindowOverlay>
            </div>
          </div>
        );
      case 'Wanted':
        return (
          <div className="wanted-instance-overlay">
            <div className="overlay-row other-overlays-row">
              <WindowOverlay onClose={handleCloseOverlay} className="trade-details-window">
                <WantedDetails
                  pokemon={selectedPokemon}
                  lists={lists}
                  ownershipData={ownershipData}
                  sortType={sortType}
                  sortMode={sortMode}
                />
              </WindowOverlay>
              <WindowOverlay onClose={handleCloseOverlay} className="wanted-instance-window">
                <WantedInstance pokemon={selectedPokemon} />
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