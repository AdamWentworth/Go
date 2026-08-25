import { act, renderHook } from '@testing-library/react-native';
import { AccessibilityInfo, Animated } from 'react-native';
import {
  resolveNativeOverlaySwipeDirection,
  shouldCaptureNativeOverlaySwipe,
  useNativeOverlaySwipeNavigation,
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

  it('queues a navigation button press made during the current slide animation', async () => {
    const animationCompletions: ((result: { finished: boolean }) => void)[] = [];
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    jest.spyOn(Animated, 'timing').mockImplementation(() => ({
      start: (completion?: (result: { finished: boolean }) => void) => {
        if (completion) animationCompletions.push(completion);
      },
      stop: jest.fn(),
      reset: jest.fn(),
    }) as unknown as Animated.CompositeAnimation);
    const animationFrame = jest.spyOn(global, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    const onNext = jest.fn();
    const onPrevious = jest.fn();
    const { result, unmount } = renderHook(() => useNativeOverlaySwipeNavigation({ onNext, onPrevious }));

    await act(async () => Promise.resolve());

    act(() => {
      result.current.navigateNext();
    });
    act(() => {
      result.current.navigatePrevious();
    });
    expect(animationCompletions).toHaveLength(1);

    act(() => animationCompletions.shift()?.({ finished: true }));
    expect(onNext).toHaveBeenCalledTimes(1);
    act(() => animationCompletions.shift()?.({ finished: true }));
    expect(animationCompletions).toHaveLength(1);

    act(() => animationCompletions.shift()?.({ finished: true }));
    expect(onPrevious).toHaveBeenCalledTimes(1);
    act(() => animationCompletions.shift()?.({ finished: true }));
    animationFrame.mockRestore();
    unmount();
  });
});
