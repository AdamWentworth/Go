// InstanceOverlay.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  const isPurified = !!p?.instanceData?.purified;
  const isShadow = !!p?.instanceData?.shadow && !isPurified;
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
  const [previewInstanceDataPatch, setPreviewInstanceDataPatch] = useState<
    Partial<PokemonInstance>
  >({});
  const liveSelectedPokemon = useMemo<OverlayPokemon | null>(() => {
    if (!selectedPokemon) return null;

    const instanceId = selectedPokemon.instanceData?.instance_id;
    const liveInstance = instanceId ? instances[instanceId] : null;
    const mergedInstanceData: Partial<PokemonInstance> = {
      ...(selectedPokemon.instanceData ?? {}),
      ...(liveInstance ?? {}),
      ...previewInstanceDataPatch,
    };

    return {
      ...selectedPokemon,
      instanceData: mergedInstanceData,
    };
  }, [instances, previewInstanceDataPatch, selectedPokemon]);

  const [isSmallScreen, setIsSmallScreen] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 686 : false
  );
  useEffect(() => {
    const handleResize = () => setIsSmallScreen(window.innerWidth <= 686);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const selectedKey =
      selectedPokemon?.instanceData?.instance_id ?? selectedPokemon?.variant_id ?? null;
    const incomingKey = pokemon.instanceData?.instance_id ?? pokemon.variant_id ?? null;

    if (selectedKey !== incomingKey) {
      setSelectedPokemon(pokemon);
      setPreviewInstanceDataPatch({});
    }
  }, [pokemon, selectedPokemon?.instanceData?.instance_id, selectedPokemon?.variant_id]);

  const handleCaughtPreviewInstanceDataChange = useCallback(
    (patch: Partial<PokemonInstance>) => {
      setPreviewInstanceDataPatch((prev) => {
        const next = { ...prev, ...patch };
        const hasChange = Object.keys(next).some((key) => {
          const typedKey = key as keyof PokemonInstance;
          return !Object.is(next[typedKey], prev[typedKey]);
        });
        return hasChange ? next : prev;
      });
    },
    [],
  );

  const [ignorePointerEvents, setIgnorePointerEvents] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setIgnorePointerEvents(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const [currentOverlay, setCurrentOverlay] = useState<OverlayType>(() =>
    deriveInitialOverlay(tagFilter, pokemon)
  );

  const activeInstanceIdHint = useMemo(() => {
    const liveId = liveSelectedPokemon?.instanceData?.instance_id;
    if (typeof liveId === 'string' && liveId.length > 0) return liveId;
    const selectedId = selectedPokemon?.instanceData?.instance_id;
    if (typeof selectedId === 'string' && selectedId.length > 0) return selectedId;
    return null;
  }, [liveSelectedPokemon?.instanceData?.instance_id, selectedPokemon?.instanceData?.instance_id]);

  useEffect(() => {
    setCurrentOverlay(deriveInitialOverlay(tagFilter, liveSelectedPokemon));
  }, [tagFilter, liveSelectedPokemon]);

  const handleOpenWantedOverlay = (pokemonData: Record<string, unknown>) => {
    setSelectedPokemon(pokemonData as unknown as OverlayPokemon);
    setPreviewInstanceDataPatch({});
    setCurrentOverlay('wanted');
  };

  const handleOpenTradeOverlay = (pokemonData: Record<string, unknown>) => {
    setSelectedPokemon(pokemonData as unknown as OverlayPokemon);
    setPreviewInstanceDataPatch({});
    setCurrentOverlay('trade');
  };

  const handleCloseOverlay = () => {
    onClose();
    setCurrentOverlay(deriveInitialOverlay(tagFilter, null));
    setSelectedPokemon(null);
    setPreviewInstanceDataPatch({});
  };

  const renderCloseButton = () => (
    <div className="close-button-container">
      <CloseButton onClick={onClose} />
    </div>
  );

  const renderContent = () => {
    const activePokemon = liveSelectedPokemon;
    switch (currentOverlay) {
      case 'caught':
        if (!activePokemon) return null;
        return (
          <div className="caught-fullscreen">
            <div className="caught-scroll">
              <div className="caught-column">
                <CaughtInstance
                  pokemon={activePokemon as CaughtOverlayPokemon}
                  isEditable={isEditable}
                  onPreviewInstanceDataChange={handleCaughtPreviewInstanceDataChange}
                  activeInstanceIdHint={activeInstanceIdHint}
                />
              </div>
            </div>
          </div>
        );
      case 'missing':
        return <div className="missing-placeholder">Missing Instance Component</div>;
      case 'trade':
        if (!activePokemon) return null;
        return (
          <div className={`trade-instance-overlay ${isSmallScreen ? 'small-screen' : ''}`}>
            <div className={`overlay-row other-overlays-row ${isSmallScreen ? 'column-layout' : ''}`}>
              <WindowOverlay onClose={handleCloseOverlay} className="trade-instance-window">
                <TradeInstance
                  pokemon={activePokemon as unknown as TradeOverlayPokemon}
                  isEditable={isEditable}
                />
              </WindowOverlay>
              <WindowOverlay onClose={handleCloseOverlay} className="trade-details-window">
                <TradeDetails
                  pokemon={withInstanceData(activePokemon) as TradeDetailsPokemon}
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
        if (!activePokemon) return null;
        return (
          <div className="wanted-instance-overlay">
            <div className={`overlay-row other-overlays-row ${isSmallScreen ? 'column-layout' : ''}`}>
              <WindowOverlay onClose={handleCloseOverlay} className="wanted-details-window">
                <WantedDetails
                  pokemon={withInstanceData(activePokemon) as WantedDetailsPokemon}
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
                  pokemon={activePokemon as unknown as WantedOverlayPokemon}
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

  const bgColor = currentOverlay === 'caught' ? getCaughtBgColor(liveSelectedPokemon) : null;

  // recompute the background image whenever the selected pokemon changes
  const bgImageSrc = useMemo(
    () => (currentOverlay === 'caught' ? getBackgroundImageSrc(liveSelectedPokemon) : null),
    [currentOverlay, liveSelectedPokemon]
  );

  const caughtBackgroundStyle = useMemo(
    () => ({ '--io-bg': bgColor } as React.CSSProperties),
    [bgColor],
  );

  // SINGLE debug log for this file
  useEffect(() => {
    if (currentOverlay === 'caught') {
      dbg('Background image:', bgImageSrc, 'for', liveSelectedPokemon?.name ?? '(unknown)');
    }
  }, [currentOverlay, bgImageSrc, liveSelectedPokemon?.name]);

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
