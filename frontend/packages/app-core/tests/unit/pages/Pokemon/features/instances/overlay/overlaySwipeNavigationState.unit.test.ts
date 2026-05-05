import { describe, expect, it } from 'vitest';

import {
  clampSwipeOffsetX,
  createActiveSwipeState,
  createInactiveSwipeState,
  getNavigationOffsets,
  getOverlayMotionStyle,
  getSwipeEndDirection,
  getSwipeMoveResult,
} from '@/pages/Pokemon/features/instances/overlay/overlaySwipeNavigationState';

describe('overlaySwipeNavigationState', () => {
  it('creates inactive and active swipe states', () => {
    expect(createInactiveSwipeState()).toEqual({
      active: false,
      startX: 0,
      startY: 0,
    });
    expect(createActiveSwipeState(240, 120)).toEqual({
      active: true,
      startX: 240,
      startY: 120,
    });
  });

  it('clamps horizontal drag offset to the visual swipe range', () => {
    expect(clampSwipeOffsetX(-240)).toBe(-180);
    expect(clampSwipeOffsetX(-80)).toBe(-80);
    expect(clampSwipeOffsetX(260)).toBe(180);
  });

  it('reports horizontal movement only after the axis resolves horizontally', () => {
    const state = createActiveSwipeState(260, 220);

    expect(getSwipeMoveResult(state, 254, 250, null)).toEqual({
      axis: 'y',
      horizontal: false,
      offsetX: 0,
    });

    expect(getSwipeMoveResult(state, 190, 224, null)).toEqual({
      axis: 'x',
      horizontal: true,
      offsetX: -70,
    });
  });

  it('keeps a previously resolved axis locked for the drag', () => {
    const state = createActiveSwipeState(260, 220);

    expect(getSwipeMoveResult(state, 250, 300, 'x')).toEqual({
      axis: 'x',
      horizontal: true,
      offsetX: -10,
    });
    expect(getSwipeMoveResult(state, 160, 224, 'y')).toEqual({
      axis: 'y',
      horizontal: false,
      offsetX: 0,
    });
  });

  it('returns navigation direction only for committed horizontal swipes', () => {
    const state = createActiveSwipeState(260, 220);

    expect(getSwipeEndDirection(state, 205, 'x')).toBeNull();
    expect(getSwipeEndDirection(state, 204, 'x')).toBe('next');
    expect(getSwipeEndDirection(state, 320, 'x')).toBe('previous');
    expect(getSwipeEndDirection(state, 120, 'y')).toBeNull();
    expect(getSwipeEndDirection(createInactiveSwipeState(), 120, 'x')).toBeNull();
  });

  it('keeps navigation animation offsets stable by direction', () => {
    expect(getNavigationOffsets('next')).toEqual({
      exitOffset: -140,
      enterOffset: 110,
    });
    expect(getNavigationOffsets('previous')).toEqual({
      exitOffset: 140,
      enterOffset: -110,
    });
  });

  it('builds overlay motion styles only for navigable overlays', () => {
    expect(
      getOverlayMotionStyle({
        isNavigableOverlay: false,
        swipeOffsetX: 42,
        swipeTransitionEnabled: true,
      }),
    ).toBeUndefined();

    expect(
      getOverlayMotionStyle({
        isNavigableOverlay: true,
        swipeOffsetX: -80,
        swipeTransitionEnabled: false,
      }),
    ).toEqual({
      transform: 'translateX(-80px)',
      transition: 'none',
    });

    expect(
      getOverlayMotionStyle({
        isNavigableOverlay: true,
        swipeOffsetX: 0,
        swipeTransitionEnabled: true,
      }),
    ).toEqual({
      transform: 'translateX(0px)',
      transition: 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
    });
  });
});
