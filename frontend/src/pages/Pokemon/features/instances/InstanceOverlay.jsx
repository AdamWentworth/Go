// InstanceOverlay.jsx
import React, { useState, useEffect, useMemo } from 'react';
import './InstanceOverlay.css';
import OverlayPortal from '@/components/OverlayPortal';
import WindowOverlay from '@/components/WindowOverlay';
import OwnedInstance from './OwnedInstance';
import TradeInstance from './TradeInstance';
import TradeDetails from './components/Trade/TradeDetails';
import WantedInstance from './WantedInstance';
import WantedDetails from './components/Wanted/WantedDetails';
import CloseButton from '@/components/CloseButton.jsx';

const toKey = (v) => (v ?? '').toString().trim().toLowerCase();
// map aliases/synonyms to canonical keys used by the switch
const CANON = (k) => {
  const key = toKey(k);
  if (key === 'owned') return 'caught';
  if (key === 'unowned') return 'missing';
  return key;
};

const deriveInitialOverlay = (tagFilter, pokemon) => {
  const fromTag = CANON(tagFilter);
  if (['caught', 'missing', 'trade', 'wanted'].includes(fromTag)) return fromTag;

  // Fallback to instance status if available
  const status = CANON(pokemon?.instanceData?.status || pokemon?.status);
  if (['caught', 'missing', 'trade', 'wanted'].includes(status)) return status;

  // Sensible default
  return 'caught';
};

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

  // Screen size (SSR-safe)
  const [isSmallScreen, setIsSmallScreen] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 686 : false
  );
  useEffect(() => {
    const handleResize = () => setIsSmallScreen(window.innerWidth <= 686);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Briefly ignore pointer events after mount
  const [ignorePointerEvents, setIgnorePointerEvents] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setIgnorePointerEvents(false), 300);
    return () => clearTimeout(timer);
  }, []);

  // Compute current overlay canonically from tagFilter/pokemon
  const [currentOverlay, setCurrentOverlay] = useState(() =>
    deriveInitialOverlay(tagFilter, pokemon)
  );

  // Keep overlay in sync if tagFilter or selectedPokemon changes
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
    // When closing, reset to tag-derived view for next open
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
          <WindowOverlay onClose={handleCloseOverlay} className="owned-instance-window">
            <OwnedInstance pokemon={selectedPokemon} isEditable={isEditable} />
          </WindowOverlay>
        );
      case 'missing':
        return <div>Unowned Instance Component</div>;
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

  // Note: className check now uses canonical key 'caught'
  return (
    <OverlayPortal>
      <div
        className={`instance-overlay ${currentOverlay === 'caught' ? 'owned-overlay' : ''}`}
        style={{ pointerEvents: ignorePointerEvents ? 'none' : 'auto' }}
      >
        {renderContent()}
        {renderCloseButton()}
      </div>
    </OverlayPortal>
  );
};

export default InstanceOverlay;
