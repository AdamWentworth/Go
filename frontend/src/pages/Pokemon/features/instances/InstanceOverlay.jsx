// InstanceOverlay.jsx
import React, { useState, useEffect } from 'react';
import './InstanceOverlay.css';
import OverlayPortal from '@/components/OverlayPortal';
import WindowOverlay from '@/components/WindowOverlay';
import CaughtInstance from './CaughtInstance';
import TradeInstance from './TradeInstance';
import TradeDetails from './components/Trade/TradeDetails';
import WantedInstance from './WantedInstance';
import WantedDetails from './components/Wanted/WantedDetails';
import CloseButton from '@/components/CloseButton.jsx';

const BG_VIDEO_SRC = '/assets/bug_bg.mp4';

const toKey = (v) => (v ?? '').toString().trim().toLowerCase();
const CANON = (k) => {
  const key = toKey(k);
  if (key === 'owned') return 'caught';
  if (key === 'unowned') return 'missing';
  return key;
};

const deriveInitialOverlay = (tagFilter, pokemon) => {
  const fromTag = CANON(tagFilter);
  if (['caught', 'missing', 'trade', 'wanted'].includes(fromTag)) return fromTag;

  const status = CANON(pokemon?.instanceData?.status || pokemon?.status);
  if (['caught', 'missing', 'trade', 'wanted'].includes(status)) return status;

  return 'caught';
};

// placeholder; later you can compute a color from pokemon type, shiny, etc.
const getCaughtBgColor = (pokemon) => '#0f2b2b';

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
  const [selectedPokemon, setSelectedPokemon] = useState(pokemon);

  const [isSmallScreen, setIsSmallScreen] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 686 : false
  );
  useEffect(() => {
    const handleResize = () => setIsSmallScreen(window.innerWidth <= 686);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [ignorePointerEvents, setIgnorePointerEvents] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setIgnorePointerEvents(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const [currentOverlay, setCurrentOverlay] = useState(() =>
    deriveInitialOverlay(tagFilter, pokemon)
  );

  useEffect(() => {
    setCurrentOverlay(deriveInitialOverlay(tagFilter, selectedPokemon));
  }, [tagFilter, selectedPokemon]);

  const handleOpenWantedOverlay = (pokemonData) => {
    setSelectedPokemon(pokemonData);
    setCurrentOverlay('wanted');
  };

  const handleOpenTradeOverlay = (pokemonData) => {
    setSelectedPokemon(pokemonData);
    setCurrentOverlay('trade');
  };

  const handleCloseOverlay = () => {
    onClose();
    setCurrentOverlay(deriveInitialOverlay(tagFilter, null));
    setSelectedPokemon(null);
  };

  const renderCloseButton = () => (
    <div className="close-button-container">
      <CloseButton onClick={onClose} />
    </div>
  );

  const renderContent = () => {
    switch (currentOverlay) {
      case 'caught':
        return (
          <div className="caught-fullscreen">
            <div className="caught-scroll">
              {/* column wrapper so most content flows in a single centered column */}
              <div className="caught-column">
                <CaughtInstance pokemon={selectedPokemon} isEditable={isEditable} />
              </div>
            </div>
          </div>
        );

      case 'missing':
        return <div className="missing-placeholder">Unowned Instance Component</div>;

      case 'trade':
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

      case 'wanted':
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

  const bgColor = currentOverlay === 'caught' ? getCaughtBgColor(selectedPokemon) : null;

  return (
    <OverlayPortal>
      <div
        className={`instance-overlay ${currentOverlay === 'caught' ? 'caught-mode' : ''}`}
        style={{ pointerEvents: ignorePointerEvents ? 'none' : 'auto' }}
      >
        {/* BACKGROUND: fixed video behind everything in the overlay */}
        {currentOverlay === 'caught' && (
          <div className="io-bg" style={{ ['--io-bg']: bgColor }}>
            <video
              className="io-bg-video"
              src={BG_VIDEO_SRC}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              aria-hidden="true"
            />
          </div>
        )}

        {renderContent()}
        {renderCloseButton()}
      </div>
    </OverlayPortal>
  );
};

export default InstanceOverlay;
