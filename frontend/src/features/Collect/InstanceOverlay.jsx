// InstanceOverlay.jsx
import React, { useState, useEffect } from 'react';
import './InstanceOverlay.css';
import OwnedInstance from './InstanceOverlayComponents/OwnedInstance';
import TradeInstance from './InstanceOverlayComponents/TradeInstance';
import TradeDetails from './InstanceOverlayComponents/TradeComponents/TradeDetails';
import WantedInstance from './InstanceOverlayComponents/WantedInstance';
import WantedDetails from './InstanceOverlayComponents/WantedComponents/WantedDetails';
import WindowOverlay from './WindowOverlay';

const InstanceOverlay = ({ pokemon, onClose, variants, ownershipFilter, lists, ownershipData, sortType, sortMode, isEditable }) => {
  // console.log("Rendering InstanceOverlay for pokemon:", pokemon);
  const [currentOverlay, setCurrentOverlay] = useState(ownershipFilter);
  const [selectedPokemon, setSelectedPokemon] = useState(pokemon);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 686);

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth <= 686);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleOverlayClick = (event) => {
    if (!event.target.closest('.overlay-windows')) {
      onClose();
    }
  };

  const handleOpenWantedOverlay = (pokemonData) => {
    setSelectedPokemon(pokemonData);
    setCurrentOverlay('Wanted');
  };

  const handleOpenTradeOverlay = (pokemonData) => {
    setSelectedPokemon(pokemonData);
    setCurrentOverlay('Trade');
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
            <OwnedInstance pokemon={selectedPokemon} isEditable={isEditable} />
          </WindowOverlay>
        );
      case 'Unowned':
        return <div>Unowned Instance Component</div>; // Placeholder for UnownedInstance component
      case 'Trade':
        return (
          <div className={`trade-instance-overlay ${isSmallScreen ? 'small-screen' : ''}`}>
            <div className={`overlay-row other-overlays-row ${isSmallScreen ? 'column-layout' : ''}`}>
              <WindowOverlay onClose={handleCloseOverlay} className="trade-instance-window">
                <TradeInstance pokemon={selectedPokemon} isEditable={isEditable} />
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
                  isEditable={isEditable}
                />
              </WindowOverlay>
            </div>
          </div>
        );
      case 'Wanted':
        return (
          <div className="wanted-instance-overlay">
            <div className={`overlay-row other-overlays-row ${isSmallScreen ? 'column-layout' : ''}`}>
              <WindowOverlay onClose={handleCloseOverlay} className="wanted-details-window">
                <WantedDetails
                  pokemon={selectedPokemon}
                  lists={lists}
                  ownershipData={ownershipData}
                  sortType={sortType}
                  sortMode={sortMode}
                  openTradeOverlay={handleOpenTradeOverlay}
                  variants={variants}
                  isEditable={isEditable}
                />
              </WindowOverlay>
              <WindowOverlay onClose={handleCloseOverlay} className="wanted-instance-window">
                <WantedInstance pokemon={selectedPokemon} isEditable={isEditable} />
              </WindowOverlay>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div 
      className={`instance-overlay ${currentOverlay === 'Owned' ? 'owned-overlay' : ''}`} 
      onClick={handleOverlayClick}
    >
      {isSmallScreen && (
        <button className="close-overlay-button" onClick={handleCloseOverlay}>
          &times;
        </button>
      )}
      {renderContent()}
    </div>
  );
};

export default InstanceOverlay;