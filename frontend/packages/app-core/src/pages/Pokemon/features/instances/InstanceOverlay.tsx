// InstanceOverlay.jsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import './InstanceOverlay.css';
import OverlayPortal from '@/components/OverlayPortal';
import WindowOverlay from '@/components/WindowOverlay';
import CaughtInstance from './CaughtInstance';
import TradeInstance from './TradeInstance';
import TradeTargetsPanel from './components/Trade/TradeTargetsPanel';
import WantedInstance from './WantedInstance';
import WantedDetails from './components/Wanted/WantedDetails';
import CloseButton from '@/components/CloseButton';

const STACKED_INSTANCE_OVERLAY_BREAKPOINT = 768;
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
  navigationPokemons?: OverlayPokemon[];
  onNavigatePokemon?: (pokemon: OverlayPokemon) => void;
}

type SwipeCaptureHandlers = {
  onDragStart: React.DragEventHandler<HTMLDivElement>;
  onPointerDownCapture: React.PointerEventHandler<HTMLDivElement>;
  onPointerUpCapture: React.PointerEventHandler<HTMLDivElement>;
  onPointerMoveCapture: React.PointerEventHandler<HTMLDivElement>;
  onMouseDownCapture: React.MouseEventHandler<HTMLDivElement>;
  onMouseUpCapture: React.MouseEventHandler<HTMLDivElement>;
  onMouseMoveCapture: React.MouseEventHandler<HTMLDivElement>;
  onTouchStartCapture: React.TouchEventHandler<HTMLDivElement>;
  onTouchEndCapture: React.TouchEventHandler<HTMLDivElement>;
  onTouchMoveCapture: React.TouchEventHandler<HTMLDivElement>;
};

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
type TradeTargetsPanelPokemon = React.ComponentProps<typeof TradeTargetsPanel>['pokemon'];
type WantedOverlayPokemon = React.ComponentProps<typeof WantedInstance>['pokemon'];
type WantedDetailsPokemon = React.ComponentProps<typeof WantedDetails>['pokemon'];

const withInstanceData = (
  value: OverlayPokemon,
): OverlayPokemon & { instanceData: Partial<PokemonInstance> } => ({
  ...value,
  instanceData: value.instanceData ?? {},
});

const getOverlayIdentityKey = (value: OverlayPokemon | null | undefined): string | null => {
  if (!value) return null;
  const instanceId = value.instanceData?.instance_id;
  if (typeof instanceId === 'string' && instanceId.trim().length > 0) {
    return `instance:${instanceId}`;
  }
  const variantId = value.variant_id;
  if (typeof variantId === 'string' && variantId.trim().length > 0) {
    return `variant:${variantId}`;
  }
  const pokemonId = value.pokemon_id;
  if (typeof pokemonId === 'number' && Number.isFinite(pokemonId)) {
    return `pokemon:${pokemonId}:${String(value.variantType ?? '')}`;
  }
  return null;
};

export const isSwipeInteractiveTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      [
        'button',
        'a',
        '[role="button"]',
        'textarea',
        'select',
        'summary',
        'details',
        '[contenteditable="true"]',
        'input[type="text"]',
        'input[type="number"]',
        'input[type="date"]',
        'input[type="checkbox"]',
        'input[type="radio"]',
        '.mirror',
        '.favorite-component',
        '.background-button',
        '.toggleable-image',
        '.reset-container',
        '.trade-target-reset-button',
      ].join(', '),
    ),
  );
};

const resolveSwipeAxis = (
  deltaX: number,
  deltaY: number,
  currentAxis: 'x' | 'y' | null,
): 'x' | 'y' | null => {
  if (currentAxis) return currentAxis;

  const absDeltaX = Math.abs(deltaX);
  const absDeltaY = Math.abs(deltaY);

  // Require clearer intent before conceding to vertical scrolling.
  if (absDeltaX >= 10 && absDeltaX >= absDeltaY * 0.9) {
    return 'x';
  }

  if (absDeltaY >= 14 && absDeltaY > absDeltaX * 1.35) {
    return 'y';
  }

  return null;
};

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
  navigationPokemons = [],
  onNavigatePokemon,
}) => {
  const navTimeoutsRef = useRef<number[]>([]);
  const swipeStateRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
  }>({
    active: false,
    startX: 0,
    startY: 0,
  });
  const swipeAxisRef = useRef<'x' | 'y' | null>(null);
  const overlayRootRef = useRef<HTMLDivElement | null>(null);
  const [swipeOffsetX, setSwipeOffsetX] = useState(0);
  const [swipeTransitionEnabled, setSwipeTransitionEnabled] = useState(false);
  const [isSwipeAnimating, setIsSwipeAnimating] = useState(false);
  const [isBackgroundTransitioning, setIsBackgroundTransitioning] = useState(false);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isHorizontalSwiping, setIsHorizontalSwiping] = useState(false);

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
    typeof window !== 'undefined'
      ? window.innerWidth < STACKED_INSTANCE_OVERLAY_BREAKPOINT
      : false
  );
  useEffect(() => {
    const handleResize = () =>
      setIsSmallScreen(window.innerWidth < STACKED_INSTANCE_OVERLAY_BREAKPOINT);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const incomingNavigationKey = useMemo(
    () => getOverlayIdentityKey(pokemon),
    [pokemon],
  );
  const lastIncomingNavigationKeyRef = useRef<string | null>(incomingNavigationKey);

  useEffect(() => {
    if (incomingNavigationKey === lastIncomingNavigationKeyRef.current) return;
    lastIncomingNavigationKeyRef.current = incomingNavigationKey;

    navTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    navTimeoutsRef.current = [];
    setSelectedPokemon(pokemon);
    setPreviewInstanceDataPatch({});
    setSwipeOffsetX(0);
    setSwipeTransitionEnabled(false);
    setIsSwipeAnimating(false);
    setIsBackgroundTransitioning(false);
    setIsHorizontalSwiping(false);
  }, [incomingNavigationKey, pokemon]);

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
  const isNavigableOverlay = currentOverlay === 'caught' || currentOverlay === 'trade';

  const navigablePokemons = useMemo(
    () =>
      navigationPokemons.filter(
        (entry): entry is OverlayPokemon =>
          Boolean(
            entry &&
              entry.instanceData &&
              typeof entry.instanceData.instance_id === 'string' &&
              entry.instanceData.instance_id.length > 0,
          ),
      ),
    [navigationPokemons],
  );

  const currentNavigationKey = useMemo(
    () => getOverlayIdentityKey(liveSelectedPokemon ?? selectedPokemon ?? pokemon),
    [liveSelectedPokemon, pokemon, selectedPokemon],
  );

  const navigationIndex = useMemo(() => {
    if (!currentNavigationKey) return -1;
    return navigablePokemons.findIndex(
      (entry) => getOverlayIdentityKey(entry) === currentNavigationKey,
    );
  }, [currentNavigationKey, navigablePokemons]);

  const previousPokemon =
    navigationIndex > 0 ? navigablePokemons[navigationIndex - 1] : null;
  const nextPokemon =
    navigationIndex >= 0 && navigationIndex < navigablePokemons.length - 1
      ? navigablePokemons[navigationIndex + 1]
      : null;

  const scheduleNavTimeout = useCallback((handler: () => void, delayMs: number) => {
    const timeoutId = window.setTimeout(() => {
      navTimeoutsRef.current = navTimeoutsRef.current.filter((id) => id !== timeoutId);
      handler();
    }, delayMs);
    navTimeoutsRef.current.push(timeoutId);
  }, []);

  useEffect(() => {
    return () => {
      navTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
      navTimeoutsRef.current = [];
    };
  }, []);

  const navigateToPokemon = useCallback(
    (target: OverlayPokemon | null) => {
      if (!target) return;
      setSelectedPokemon(target);
      setPreviewInstanceDataPatch({});
      onNavigatePokemon?.(target);
    },
    [onNavigatePokemon],
  );

  const animateNavigation = useCallback(
    (direction: 'previous' | 'next') => {
      if (!isNavigableOverlay) return;
      if (isSwipeAnimating) return;

      const target = direction === 'next' ? nextPokemon : previousPokemon;
      if (!target) {
        setSwipeTransitionEnabled(true);
        setSwipeOffsetX(0);
        return;
      }

      const exitOffset = direction === 'next' ? -140 : 140;
      const enterOffset = direction === 'next' ? 110 : -110;

      setIsSwipeAnimating(true);
      setSwipeTransitionEnabled(true);
      setSwipeOffsetX(exitOffset);
      setIsBackgroundTransitioning(true);

      scheduleNavTimeout(() => {
        navigateToPokemon(target);
        setSwipeTransitionEnabled(false);
        setSwipeOffsetX(enterOffset);

        requestAnimationFrame(() => {
          setSwipeTransitionEnabled(true);
          setSwipeOffsetX(0);
        });

        scheduleNavTimeout(() => {
          setIsSwipeAnimating(false);
          setIsBackgroundTransitioning(false);
        }, 220);
      }, 120);
    },
    [
      isNavigableOverlay,
      isSwipeAnimating,
      navigateToPokemon,
      nextPokemon,
      previousPokemon,
      scheduleNavTimeout,
    ],
  );

  const handleNavigatePrevious = useCallback(() => {
    animateNavigation('previous');
  }, [animateNavigation]);

  const handleNavigateNext = useCallback(() => {
    animateNavigation('next');
  }, [animateNavigation]);

  const resetSwipeState = useCallback(() => {
    swipeStateRef.current = {
      active: false,
      startX: 0,
      startY: 0,
    };
    swipeAxisRef.current = null;
    setIsSwiping(false);
    setIsHorizontalSwiping(false);
  }, []);

  const cancelSwipeAndResetOffset = useCallback(() => {
    if (!swipeStateRef.current.active) return;
    setSwipeTransitionEnabled(true);
    setSwipeOffsetX(0);
    resetSwipeState();
  }, [resetSwipeState]);

  const beginSwipe = useCallback(
    (target: EventTarget | null, clientX: number, clientY: number) => {
      if (!isNavigableOverlay) return;
      if (isSwipeInteractiveTarget(target)) return;
      if (swipeStateRef.current.active) return;
      if (isSwipeAnimating) return;

      swipeStateRef.current = {
        active: true,
        startX: clientX,
        startY: clientY,
      };
      swipeAxisRef.current = null;
      setIsSwiping(true);
      setSwipeTransitionEnabled(false);
    },
    [isNavigableOverlay, isSwipeAnimating],
  );

  const moveSwipe = useCallback(
    (clientX: number, clientY: number): boolean => {
      const swipeState = swipeStateRef.current;
      if (!swipeState.active || isSwipeAnimating) return false;

      const deltaX = clientX - swipeState.startX;
      const deltaY = clientY - swipeState.startY;
      swipeAxisRef.current = resolveSwipeAxis(deltaX, deltaY, swipeAxisRef.current);
      if (swipeAxisRef.current !== 'x') return false;

      setIsHorizontalSwiping(true);

      const clampedOffset = Math.max(-180, Math.min(180, deltaX));
      setSwipeOffsetX(clampedOffset);
      return true;
    },
    [isSwipeAnimating],
  );

  const endSwipe = useCallback(
    (clientX: number, clientY: number) => {
      const swipeState = swipeStateRef.current;
      if (!swipeState.active) return;

      const deltaX = clientX - swipeState.startX;
      const absDeltaX = Math.abs(deltaX);
      const isHorizontalSwipe =
        swipeAxisRef.current === 'x' && absDeltaX >= 56;

      if (isHorizontalSwipe) {
        if (deltaX < 0) {
          animateNavigation('next');
        } else {
          animateNavigation('previous');
        }
      } else {
        setSwipeTransitionEnabled(true);
        setSwipeOffsetX(0);
      }

      resetSwipeState();
    },
    [animateNavigation, resetSwipeState],
  );

  const handleOverlayPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      if (isSwipeInteractiveTarget(event.target)) return;

      event.stopPropagation();
      if (event.pointerType === 'mouse') {
        event.preventDefault();
      }
      if (isNavigableOverlay) {
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          // Ignore capture failures; window listeners still backstop drag tracking.
        }
      }
      beginSwipe(event.target, event.clientX, event.clientY);
    },
    [beginSwipe, isNavigableOverlay],
  );

  const handleOverlayPointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!swipeStateRef.current.active) return;
      event.stopPropagation();
      if (isNavigableOverlay) {
        try {
          event.currentTarget.releasePointerCapture(event.pointerId);
        } catch {
          // Ignore capture release failures.
        }
      }
      endSwipe(event.clientX, event.clientY);
    },
    [endSwipe, isNavigableOverlay],
  );

  const handleOverlayPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!swipeStateRef.current.active) return;
      event.stopPropagation();
      const horizontalSwipe = moveSwipe(event.clientX, event.clientY);
      if (horizontalSwipe) {
        event.preventDefault();
      }
    },
    [moveSwipe],
  );

  const handleOverlayMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      if (isSwipeInteractiveTarget(event.target)) return;

      event.stopPropagation();
      event.preventDefault();
      beginSwipe(event.target, event.clientX, event.clientY);
    },
    [beginSwipe],
  );

  const handleOverlayMouseUp = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!swipeStateRef.current.active) return;
      event.stopPropagation();
      endSwipe(event.clientX, event.clientY);
    },
    [endSwipe],
  );

  const handleOverlayMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!swipeStateRef.current.active) return;
      event.stopPropagation();
      moveSwipe(event.clientX, event.clientY);
    },
    [moveSwipe],
  );

  const handleOverlayTouchStart = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      if (isSwipeInteractiveTarget(event.target)) return;

      event.stopPropagation();
      const touch = event.touches[0];
      if (!touch) return;
      beginSwipe(event.target, touch.clientX, touch.clientY);
    },
    [beginSwipe],
  );

  const handleOverlayTouchEnd = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      if (!swipeStateRef.current.active) return;
      event.stopPropagation();
      const touch = event.changedTouches[0];
      if (!touch) return;
      endSwipe(touch.clientX, touch.clientY);
    },
    [endSwipe],
  );

  const handleOverlayTouchMove = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      if (!swipeStateRef.current.active) return;
      event.stopPropagation();
      const touch = event.touches[0];
      if (!touch) return;
      const horizontalSwipe = moveSwipe(touch.clientX, touch.clientY);
      if (horizontalSwipe) {
        event.preventDefault();
      }
    },
    [moveSwipe],
  );

  useEffect(() => {
    if (!isSwiping) return;

    const onWindowMouseMove = (event: MouseEvent) => {
      const horizontalSwipe = moveSwipe(event.clientX, event.clientY);
      if (horizontalSwipe) {
        event.preventDefault();
      }
    };
    const onWindowMouseUp = (event: MouseEvent) => {
      endSwipe(event.clientX, event.clientY);
    };
    const onWindowTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      const horizontalSwipe = moveSwipe(touch.clientX, touch.clientY);
      if (horizontalSwipe && event.cancelable) {
        event.preventDefault();
      }
    };
    const onWindowTouchEnd = (event: TouchEvent) => {
      const touch = event.changedTouches[0];
      if (!touch) return;
      endSwipe(touch.clientX, touch.clientY);
    };

    window.addEventListener('mousemove', onWindowMouseMove);
    window.addEventListener('mouseup', onWindowMouseUp);
    window.addEventListener('touchmove', onWindowTouchMove, { passive: false });
    window.addEventListener('touchend', onWindowTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onWindowMouseMove);
      window.removeEventListener('mouseup', onWindowMouseUp);
      window.removeEventListener('touchmove', onWindowTouchMove);
      window.removeEventListener('touchend', onWindowTouchEnd);
    };
  }, [endSwipe, isSwiping, moveSwipe]);

  useEffect(() => {
    if (!isNavigableOverlay) return;

    const isWithinOverlay = (target: EventTarget | null): boolean => {
      const root = overlayRootRef.current;
      return target instanceof Node && root ? root.contains(target) : false;
    };

    const onDocumentPointerDown = (event: PointerEvent) => {
      if (ignorePointerEvents) return;
      if (!isWithinOverlay(event.target)) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      if (isSwipeInteractiveTarget(event.target)) return;
      if (event.pointerType === 'mouse' && event.cancelable) {
        event.preventDefault();
      }
      beginSwipe(event.target, event.clientX, event.clientY);
    };

    const onDocumentPointerMove = (event: PointerEvent) => {
      if (!isWithinOverlay(event.target) && !swipeStateRef.current.active) return;
      const horizontalSwipe = moveSwipe(event.clientX, event.clientY);
      if (horizontalSwipe && event.cancelable) {
        event.preventDefault();
      }
    };

    const onDocumentPointerUp = (event: PointerEvent) => {
      if (!swipeStateRef.current.active) return;
      endSwipe(event.clientX, event.clientY);
    };

    const onDocumentPointerCancel = () => {
      cancelSwipeAndResetOffset();
    };

    document.addEventListener('pointerdown', onDocumentPointerDown, { capture: true });
    document.addEventListener('pointermove', onDocumentPointerMove, { capture: true });
    document.addEventListener('pointerup', onDocumentPointerUp, { capture: true });
    document.addEventListener('pointercancel', onDocumentPointerCancel, { capture: true });

    return () => {
      document.removeEventListener('pointerdown', onDocumentPointerDown, true);
      document.removeEventListener('pointermove', onDocumentPointerMove, true);
      document.removeEventListener('pointerup', onDocumentPointerUp, true);
      document.removeEventListener('pointercancel', onDocumentPointerCancel, true);
    };
  }, [
    beginSwipe,
    cancelSwipeAndResetOffset,
    endSwipe,
    ignorePointerEvents,
    isNavigableOverlay,
    moveSwipe,
  ]);

  const showNavigationArrows = isNavigableOverlay && navigablePokemons.length > 1;
  const hasPreviousPokemon = Boolean(previousPokemon);
  const hasNextPokemon = Boolean(nextPokemon);
  const canNavigatePrevious = hasPreviousPokemon && !isSwipeAnimating;
  const canNavigateNext = hasNextPokemon && !isSwipeAnimating;

  const overlayMotionStyle = useMemo(
    () =>
      isNavigableOverlay
        ? ({
            transform: `translateX(${swipeOffsetX}px)`,
            transition: swipeTransitionEnabled
              ? 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)'
              : 'none',
          } as React.CSSProperties)
        : undefined,
    [isNavigableOverlay, swipeOffsetX, swipeTransitionEnabled],
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

  const handleOpenTradeTargetOverlay = (pokemonData: Record<string, unknown>) => {
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

  const swipeCaptureHandlers: SwipeCaptureHandlers = {
    onDragStart: (event) => {
      if (isNavigableOverlay) {
        event.preventDefault();
      }
    },
    onPointerDownCapture: handleOverlayPointerDown,
    onPointerUpCapture: handleOverlayPointerUp,
    onPointerMoveCapture: handleOverlayPointerMove,
    onMouseDownCapture: handleOverlayMouseDown,
    onMouseUpCapture: handleOverlayMouseUp,
    onMouseMoveCapture: handleOverlayMouseMove,
    onTouchStartCapture: handleOverlayTouchStart,
    onTouchEndCapture: handleOverlayTouchEnd,
    onTouchMoveCapture: handleOverlayTouchMove,
  };

  const renderContent = () => {
    const activePokemon = liveSelectedPokemon;
    switch (currentOverlay) {
      case 'caught': {
        if (!activePokemon) return null;
        const caughtInstanceKey =
          getOverlayIdentityKey(activePokemon) ??
          `caught:${activePokemon.pokemon_id}:${String(activePokemon.variant_id ?? '')}`;
        return (
          <div className="caught-fullscreen">
            <div className="caught-scroll">
              <div className="instance-motion-shell instance-motion-shell--caught" style={overlayMotionStyle}>
                <div className="caught-column">
                  <CaughtInstance
                    key={caughtInstanceKey}
                    pokemon={activePokemon as CaughtOverlayPokemon}
                    isEditable={isEditable}
                    onPreviewInstanceDataChange={handleCaughtPreviewInstanceDataChange}
                    activeInstanceIdHint={activeInstanceIdHint}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      }
      case 'missing':
        return <div className="missing-placeholder">Missing Instance Component</div>;
      case 'trade':
        if (!activePokemon) return null;
        const tradeInstanceKey =
          getOverlayIdentityKey(activePokemon) ??
          `trade:${activePokemon.pokemon_id}:${String(activePokemon.variant_id ?? '')}`;
        return (
          <div className="instance-motion-shell instance-motion-shell--trade" style={overlayMotionStyle}>
            <div
              className={`trade-instance-overlay ${isSmallScreen ? 'small-screen' : ''}`}
            >
              <div className={`overlay-row other-overlays-row ${isSmallScreen ? 'column-layout' : ''}`}>
                <WindowOverlay onClose={handleCloseOverlay} className="trade-instance-window">
                  <div className="trade-pane-scroll trade-pane-scroll--offer">
                    <div className="trade-pane-shell trade-pane-shell--offer">
                      <TradeInstance
                        key={tradeInstanceKey}
                        pokemon={activePokemon as unknown as TradeOverlayPokemon}
                        isEditable={isEditable}
                      />
                    </div>
                  </div>
                </WindowOverlay>
                <WindowOverlay
                  onClose={handleCloseOverlay}
                  className="trade-details-window"
                  {...swipeCaptureHandlers}
                >
                  <div className="trade-pane-scroll trade-pane-scroll--targets">
                    <div className="trade-pane-shell trade-pane-shell--targets">
                      <TradeTargetsPanel
                        key={`${tradeInstanceKey}:details`}
                        pokemon={withInstanceData(activePokemon) as TradeTargetsPanelPokemon}
                        lists={lists}
                        instances={instances}
                        sortType={sortType}
                        sortMode={sortMode}
                        onClose={handleCloseOverlay}
                        openTradeTargetOverlay={handleOpenTradeTargetOverlay}
                        variants={variants}
                        isEditable={isEditable}
                        username={username}
                        swipeCaptureHandlers={swipeCaptureHandlers}
                      />
                    </div>
                  </div>
                </WindowOverlay>
              </div>
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

  const showTypeBackground = currentOverlay === 'caught' || currentOverlay === 'trade';
  const bgColor = showTypeBackground ? getCaughtBgColor(liveSelectedPokemon) : null;

  // recompute the background image whenever the selected pokemon changes
  const bgImageSrc = useMemo(
    () => (showTypeBackground ? getBackgroundImageSrc(liveSelectedPokemon) : null),
    [liveSelectedPokemon, showTypeBackground]
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
        ref={overlayRootRef}
        className={`instance-overlay ${currentOverlay === 'caught' ? 'caught-mode' : ''} ${currentOverlay === 'trade' ? 'trade-mode' : ''} ${isSwiping ? 'is-swiping' : ''} ${isHorizontalSwiping ? 'is-horizontal-swiping' : ''}`}
        style={{ pointerEvents: ignorePointerEvents ? 'none' : 'auto' }}
        {...swipeCaptureHandlers}
        onMouseLeave={cancelSwipeAndResetOffset}
        onTouchCancel={cancelSwipeAndResetOffset}
        onPointerCancel={cancelSwipeAndResetOffset}
      >
        {showTypeBackground && (
          <div className="io-bg" style={caughtBackgroundStyle}>
            <img
              className={`io-bg-img ${isBackgroundTransitioning ? 'is-transitioning' : ''}`}
              src={bgImageSrc ?? '/images/backgrounds/bg_normal.png'}
              alt=""
              aria-hidden="true"
              decoding="async"
              loading="eager"
            />
          </div>
        )}

        {showNavigationArrows && hasPreviousPokemon ? (
          <button
            type="button"
            className="instance-nav-arrow instance-nav-arrow--left"
            onClick={handleNavigatePrevious}
            disabled={!canNavigatePrevious}
            aria-label="Previous Pokemon"
            title="Previous Pokemon"
          >
            {'\u25C0'}
          </button>
        ) : null}
        {renderContent()}
        {showNavigationArrows && hasNextPokemon ? (
          <button
            type="button"
            className="instance-nav-arrow instance-nav-arrow--right"
            onClick={handleNavigateNext}
            disabled={!canNavigateNext}
            aria-label="Next Pokemon"
            title="Next Pokemon"
          >
            {'\u25B6'}
          </button>
        ) : null}
        {renderCloseButton()}
      </div>
    </OverlayPortal>
  );
};

export default InstanceOverlay;
