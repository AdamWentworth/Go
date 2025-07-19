// InstanceOverlay.jsx
import React, { useState, useEffect } from 'react';
import './InstanceOverlay.css';
import OverlayPortal from '@/components/OverlayPortal';
import WindowOverlay from '@/components/WindowOverlay';
import OwnedInstance from './OwnedInstance';
import TradeInstance from './TradeInstance';
import TradeDetails from './components/Trade/TradeDetails';
import WantedInstance from './WantedInstance';
import WantedDetails from './components/Wanted/WantedDetails';
import CloseButton from '@/components/CloseButton.jsx';

const InstanceOverlay = ({
  pokemon,
  onClose,
  variants,
  tagFilter,
  lists,
  instances,
  sortType,
  sortMode,
  isEditable,
  username,
}) => {
  // console.log("Rendering InstanceOverlay for pokemon:", pokemon);
  const [currentOverlay, setCurrentOverlay] = useState(tagFilter);
  const [selectedPokemon, setSelectedPokemon] = useState(pokemon);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 686);

  // NEW: State to disable pointer events briefly after mount
  const [ignorePointerEvents, setIgnorePointerEvents] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      setIgnorePointerEvents(false);
    }, 300); // 300ms delay; adjust as needed
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth <= 686);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

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
    setCurrentOverlay(tagFilter);
    setSelectedPokemon(null);
  };

  const renderCloseButton = () => (
    <div className="close-button-container">
      <CloseButton onClick={onClose} />
    </div>
  );

  const renderContent = () => {
    switch (currentOverlay) {
      case 'Owned':
        return (
          <WindowOverlay onClose={handleCloseOverlay} className="owned-instance-window">
            <OwnedInstance pokemon={selectedPokemon} isEditable={isEditable} />
          </WindowOverlay>
        );
      case 'Unowned':
        return <div>Unowned Instance Component</div>;
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
                  ownershipData={instances}
                  sortType={sortType}
                  sortMode={sortMode}
                  onClose={handleCloseOverlay}
                  openWantedOverlay={handleOpenWantedOverlay}
                  variants={variants}
                  isEditable={isEditable}
                  username={username}
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
                  ownershipData={instances}
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
    <OverlayPortal>
      <div 
        className={`instance-overlay ${currentOverlay === 'Owned' ? 'owned-overlay' : ''}`} 
        style={{ pointerEvents: ignorePointerEvents ? 'none' : 'auto' }}
      >
        {renderContent()}
        {renderCloseButton()}
      </div>
    </OverlayPortal>
  );
};

export default InstanceOverlay;
