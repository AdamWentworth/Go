import type { CSSProperties } from 'react';

import { resolveSwipeAxis } from './overlaySwipe';

export type SwipeAxis = 'x' | 'y' | null;
export type SwipeDirection = 'previous' | 'next';

export type SwipeState = {
  active: boolean;
  startX: number;
  startY: number;
};

export type SwipeMoveResult = {
  axis: SwipeAxis;
  horizontal: boolean;
  offsetX: number;
};

const MAX_SWIPE_OFFSET_X = 180;
const MIN_NAVIGATION_DELTA_X = 56;
const OVERLAY_MOTION_TRANSITION = 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)';

export const createInactiveSwipeState = (): SwipeState => ({
  active: false,
  startX: 0,
  startY: 0,
});

export const createActiveSwipeState = (clientX: number, clientY: number): SwipeState => ({
  active: true,
  startX: clientX,
  startY: clientY,
});

export const clampSwipeOffsetX = (deltaX: number): number =>
  Math.max(-MAX_SWIPE_OFFSET_X, Math.min(MAX_SWIPE_OFFSET_X, deltaX));

export const getSwipeMoveResult = (
  swipeState: SwipeState,
  clientX: number,
  clientY: number,
  currentAxis: SwipeAxis,
): SwipeMoveResult => {
  if (!swipeState.active) {
    return {
      axis: currentAxis,
      horizontal: false,
      offsetX: 0,
    };
  }

  const deltaX = clientX - swipeState.startX;
  const deltaY = clientY - swipeState.startY;
  const axis = resolveSwipeAxis(deltaX, deltaY, currentAxis);

  return {
    axis,
    horizontal: axis === 'x',
    offsetX: axis === 'x' ? clampSwipeOffsetX(deltaX) : 0,
  };
};

export const getSwipeEndDirection = (
  swipeState: SwipeState,
  clientX: number,
  currentAxis: SwipeAxis,
): SwipeDirection | null => {
  if (!swipeState.active) return null;

  const deltaX = clientX - swipeState.startX;
  if (currentAxis !== 'x' || Math.abs(deltaX) < MIN_NAVIGATION_DELTA_X) {
    return null;
  }

  return deltaX < 0 ? 'next' : 'previous';
};

export const getNavigationOffsets = (
  direction: SwipeDirection,
): { exitOffset: number; enterOffset: number } => ({
  exitOffset: direction === 'next' ? -140 : 140,
  enterOffset: direction === 'next' ? 110 : -110,
});

export const getOverlayMotionStyle = ({
  isNavigableOverlay,
  swipeOffsetX,
  swipeTransitionEnabled,
}: {
  isNavigableOverlay: boolean;
  swipeOffsetX: number;
  swipeTransitionEnabled: boolean;
}): CSSProperties | undefined => {
  if (!isNavigableOverlay) return undefined;

  return {
    transform: `translateX(${swipeOffsetX}px)`,
    transition: swipeTransitionEnabled ? OVERLAY_MOTION_TRANSITION : 'none',
  };
};
