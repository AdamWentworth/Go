// InstanceOverlay.jsx
import React, { useState, useEffect, useMemo } from 'react';
import './InstanceOverlay.css';
import OverlayPortal from '@/components/OverlayPortal';
import WindowOverlay from '@/components/WindowOverlay';
import CaughtInstance from './CaughtInstance';
import TradeInstance from './TradeInstance';
import TradeDetails from './components/Trade/TradeDetails';
import WantedInstance from './WantedInstance';
import WantedDetails from './components/Wanted/WantedDetails';
import CloseButton from '@/components/CloseButton.jsx';

const DEBUG_BG = true; // set to false to silence the single debug log
const dbg = (...args) => { if (DEBUG_BG) console.log('[BG]', ...args); };

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
const getCaughtBgColor = () => '#0f2b2b';

/** ---- Background image picker (no noisy logs) ---- **/
const TYPE_SET = new Set([
  'bug','dark','dragon','electric','fairy','fighting','fire','flying','ghost',
  'grass','ground','ice','normal','poison','psychic','rock','steel','water'
]);

const normalizeTypeName = (candidate) => {
  if (!candidate) return null;
  if (typeof candidate === 'string' || typeof candidate === 'number') {
    return String(candidate).toLowerCase();
  }
  if (typeof candidate === 'object') {
    if (typeof candidate?.name === 'string') return candidate.name.toLowerCase();
    if (typeof candidate?.type?.name === 'string') return candidate.type.name.toLowerCase();
    if (typeof candidate?.typeName === 'string') return candidate.typeName.toLowerCase();
  }
  return null;
};

const getPrimaryTypeName = (p) => {
  if (!p) return 'normal';

  // Prefer explicit string fields if present
  const prioritized = [p?.instanceData?.type1_name, p?.type1_name];
  for (const v of prioritized) {
    const norm = normalizeTypeName(v);
    if (norm && TYPE_SET.has(norm)) return norm;
  }

  // Fallbacks for common shapes
  const candidates = [
    p?.primaryType?.name ?? p?.primaryType,
    p?.primary_type?.name ?? p?.primary_type,
    p?.type1?.name ?? p?.type1,
    Array.isArray(p?.types) ? p.types[0] : null,
    Array.isArray(p?.type) ? p.type[0] : null,
    Array.isArray(p?.types) ? p.types[0]?.type?.name : null, // PokeAPI-ish
  ];
  for (const v of candidates) {
    const norm = normalizeTypeName(v);
    if (norm && TYPE_SET.has(norm)) return norm;
  }

  // Last-ditch: parse variantType like "type_bug"
  const vt = p?.variantType?.toString().toLowerCase();
  if (vt) {
    const maybe = vt.replace(/^type_/, '');
    if (TYPE_SET.has(maybe)) return maybe;
  }

  return 'normal';
};

const getBackgroundImageSrc = (p) => {
  if (!p) return '/images/backgrounds/bg_normal.png';
  const isShadow = !!p?.instanceData?.shadow;
  const isLucky  = !!p?.instanceData?.lucky;

  if (isShadow) return '/images/backgrounds/bg_shadow.png';
  if (isLucky)  return '/images/backgrounds/bg_lucky.png';

  const typeName = getPrimaryTypeName(p);
  return `/images/backgrounds/bg_${typeName}.png`;
};
/** ---------------------------------------------- **/

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
                  instances={instances}
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
                  instances={instances}
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

  // recompute the background image whenever the selected pokemon changes
  const bgImageSrc = useMemo(
    () => (currentOverlay === 'caught' ? getBackgroundImageSrc(selectedPokemon) : null),
    [currentOverlay, selectedPokemon]
  );

  // SINGLE debug log for this file
  useEffect(() => {
    if (currentOverlay === 'caught') {
      dbg('Background image:', bgImageSrc, 'for', selectedPokemon?.name ?? '(unknown)');
    }
  }, [currentOverlay, bgImageSrc, selectedPokemon?.name]);

  return (
    <OverlayPortal>
      <div
        className={`instance-overlay ${currentOverlay === 'caught' ? 'caught-mode' : ''}`}
        style={{ pointerEvents: ignorePointerEvents ? 'none' : 'auto' }}
      >
        {currentOverlay === 'caught' && (
          <div className="io-bg" style={{ ['--io-bg']: bgColor }}>
            <img
              className="io-bg-img"
              src={bgImageSrc ?? '/images/backgrounds/bg_normal.png'}
              alt=""
              aria-hidden="true"
              decoding="async"
              loading="eager"
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
