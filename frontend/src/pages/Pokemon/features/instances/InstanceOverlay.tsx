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
import CloseButton from '@/components/CloseButton';
import type { Instances } from '@/types/instances';
import type { PokemonInstance } from '@/types/pokemonInstance';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { SortMode, SortType } from '@/types/sort';
import { createScopedLogger } from '@/utils/logger';

const log = createScopedLogger('InstanceOverlay');
const dbg = (...args: unknown[]) => log.debug(...args);

type OverlayType = 'caught' | 'missing' | 'trade' | 'wanted';
type TypeCandidate = {
  name?: string;
  type?: { name?: string };
  typeName?: string;
} | string | number | null | undefined;

type OverlayPokemon = Omit<PokemonVariant, 'instanceData'> & {
  instanceData?: Partial<PokemonInstance> & {
    status?: string;
  };
  status?: string;
  type1_name?: string;
  primaryType?: TypeCandidate;
  primary_type?: TypeCandidate;
  type1?: TypeCandidate;
  types?: TypeCandidate[];
  type?: TypeCandidate[];
};

interface InstanceOverlayProps {
  pokemon: OverlayPokemon;
  onClose: () => void;
  variants: PokemonVariant[];
  tagFilter: string;
  lists: Record<string, Record<string, unknown>>;
  instances: Instances;
  sortType: SortType;
  sortMode: SortMode;
  isEditable: boolean;
  username: string;
}

const toKey = (v: unknown): string => (v ?? '').toString().trim().toLowerCase();
const CANON = (k: unknown): string => {
  const key = toKey(k);
  return key;
};

const deriveInitialOverlay = (tagFilter: unknown, pokemon: OverlayPokemon | null): OverlayType => {
  const fromTag = CANON(tagFilter);
  if (['caught', 'missing', 'trade', 'wanted'].includes(fromTag)) return fromTag as OverlayType;

  const status = CANON(pokemon?.instanceData?.status || pokemon?.status);
  if (['caught', 'missing', 'trade', 'wanted'].includes(status)) return status as OverlayType;

  return 'caught';
};

// placeholder; later you can compute a color from pokemon type, shiny, etc.
const getCaughtBgColor = (_pokemon?: OverlayPokemon | null) => '#0f2b2b';

/** ---- Background image picker (no noisy logs) ---- **/
const TYPE_SET = new Set([
  'bug','dark','dragon','electric','fairy','fighting','fire','flying','ghost',
  'grass','ground','ice','normal','poison','psychic','rock','steel','water'
]);

const isTypeCandidateObject = (
  value: unknown,
): value is { name?: string; type?: { name?: string }; typeName?: string } =>
  typeof value === 'object' && value !== null;

const normalizeTypeName = (candidate: unknown): string | null => {
  if (!candidate) return null;
  if (typeof candidate === 'string' || typeof candidate === 'number') {
    return String(candidate).toLowerCase();
  }
  if (isTypeCandidateObject(candidate)) {
    if (typeof candidate.name === 'string') return candidate.name.toLowerCase();
    if (typeof candidate.type?.name === 'string') return candidate.type.name.toLowerCase();
    if (typeof candidate.typeName === 'string') return candidate.typeName.toLowerCase();
  }
  return null;
};

const extractTypeName = (candidate: TypeCandidate): unknown => {
  if (isTypeCandidateObject(candidate)) {
    return candidate.name ?? candidate.type?.name ?? candidate.typeName;
  }
  return candidate;
};

const getPrimaryTypeName = (p: OverlayPokemon | null): string => {
  if (!p) return 'normal';

  // Prefer explicit string fields if present
  const prioritized = [p?.instanceData?.type1_name, p?.type1_name];
  for (const v of prioritized) {
    const norm = normalizeTypeName(v);
    if (norm && TYPE_SET.has(norm)) return norm;
  }

  // Fallbacks for common shapes
  const candidates = [
    extractTypeName(p.primaryType),
    extractTypeName(p.primary_type),
    extractTypeName(p.type1),
    Array.isArray(p?.types) ? p.types[0] : null,
    Array.isArray(p?.type) ? p.type[0] : null,
    Array.isArray(p?.types) ? extractTypeName(p.types[0]) : null, // PokeAPI-ish
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

const getBackgroundImageSrc = (p: OverlayPokemon | null): string => {
  if (!p) return '/images/backgrounds/bg_normal.png';
  const isShadow = !!p?.instanceData?.shadow;
  const isLucky  = !!p?.instanceData?.lucky;

  if (isShadow) return '/images/backgrounds/bg_shadow.png';
  if (isLucky)  return '/images/backgrounds/bg_lucky.png';

  const typeName = getPrimaryTypeName(p);
  return `/images/backgrounds/bg_${typeName}.png`;
};
/** ---------------------------------------------- **/

type CaughtOverlayPokemon = React.ComponentProps<typeof CaughtInstance>['pokemon'];
type TradeOverlayPokemon = React.ComponentProps<typeof TradeInstance>['pokemon'];
type TradeDetailsPokemon = React.ComponentProps<typeof TradeDetails>['pokemon'];
type WantedOverlayPokemon = React.ComponentProps<typeof WantedInstance>['pokemon'];
type WantedDetailsPokemon = React.ComponentProps<typeof WantedDetails>['pokemon'];

const withInstanceData = (
  value: OverlayPokemon,
): OverlayPokemon & { instanceData: Partial<PokemonInstance> } => ({
  ...value,
  instanceData: value.instanceData ?? {},
});

const InstanceOverlay: React.FC<InstanceOverlayProps> = ({
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
  const [selectedPokemon, setSelectedPokemon] = useState<OverlayPokemon | null>(pokemon);

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

  const [currentOverlay, setCurrentOverlay] = useState<OverlayType>(() =>
    deriveInitialOverlay(tagFilter, pokemon)
  );

  useEffect(() => {
    setCurrentOverlay(deriveInitialOverlay(tagFilter, selectedPokemon));
  }, [tagFilter, selectedPokemon]);

  const handleOpenWantedOverlay = (pokemonData: Record<string, unknown>) => {
    setSelectedPokemon(pokemonData as unknown as OverlayPokemon);
    setCurrentOverlay('wanted');
  };

  const handleOpenTradeOverlay = (pokemonData: Record<string, unknown>) => {
    setSelectedPokemon(pokemonData as unknown as OverlayPokemon);
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
        if (!selectedPokemon) return null;
        return (
          <div className="caught-fullscreen">
            <div className="caught-scroll">
              <div className="caught-column">
                <CaughtInstance
                  pokemon={selectedPokemon as CaughtOverlayPokemon}
                  isEditable={isEditable}
                />
              </div>
            </div>
          </div>
        );
      case 'missing':
        return <div className="missing-placeholder">Missing Instance Component</div>;
      case 'trade':
        if (!selectedPokemon) return null;
        return (
          <div className={`trade-instance-overlay ${isSmallScreen ? 'small-screen' : ''}`}>
            <div className={`overlay-row other-overlays-row ${isSmallScreen ? 'column-layout' : ''}`}>
              <WindowOverlay onClose={handleCloseOverlay} className="trade-instance-window">
                <TradeInstance
                  pokemon={selectedPokemon as unknown as TradeOverlayPokemon}
                  isEditable={isEditable}
                />
              </WindowOverlay>
              <WindowOverlay onClose={handleCloseOverlay} className="trade-details-window">
                <TradeDetails
                  pokemon={withInstanceData(selectedPokemon) as TradeDetailsPokemon}
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
        if (!selectedPokemon) return null;
        return (
          <div className="wanted-instance-overlay">
            <div className={`overlay-row other-overlays-row ${isSmallScreen ? 'column-layout' : ''}`}>
              <WindowOverlay onClose={handleCloseOverlay} className="wanted-details-window">
                <WantedDetails
                  pokemon={withInstanceData(selectedPokemon) as WantedDetailsPokemon}
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
                <WantedInstance
                  pokemon={selectedPokemon as unknown as WantedOverlayPokemon}
                  isEditable={isEditable}
                />
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

  const caughtBackgroundStyle = useMemo(
    () => ({ '--io-bg': bgColor } as React.CSSProperties),
    [bgColor],
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
          <div className="io-bg" style={caughtBackgroundStyle}>
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
