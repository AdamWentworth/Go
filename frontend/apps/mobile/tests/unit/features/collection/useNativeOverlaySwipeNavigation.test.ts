import {
  resolveNativeOverlaySwipeDirection,
  shouldCaptureNativeOverlaySwipe,
} from '../../../../src/features/collection/parity/useNativeOverlaySwipeNavigation';

describe('native instance overlay swipe navigation', () => {
  it('uses the same 56-point navigation threshold as the canonical overlay', () => {
    expect(resolveNativeOverlaySwipeDirection({ deltaX: -55, deltaY: 0 })).toBeNull();
    expect(resolveNativeOverlaySwipeDirection({ deltaX: -56, deltaY: 0 })).toBe('next');
    expect(resolveNativeOverlaySwipeDirection({ deltaX: 56, deltaY: 0 })).toBe('previous');
  });

  it('does not steal vertical scrolling from the detail sheet', () => {
    expect(shouldCaptureNativeOverlaySwipe({ deltaX: 9, deltaY: 0 })).toBe(false);
    expect(shouldCaptureNativeOverlaySwipe({ deltaX: 20, deltaY: 40 })).toBe(false);
    expect(shouldCaptureNativeOverlaySwipe({ deltaX: 40, deltaY: 20 })).toBe(true);
    expect(resolveNativeOverlaySwipeDirection({ deltaX: 70, deltaY: 100 })).toBeNull();
  });
});
