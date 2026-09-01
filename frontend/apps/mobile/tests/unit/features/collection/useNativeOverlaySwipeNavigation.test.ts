import { act, renderHook } from '@testing-library/react-native';
import { collectionExperienceParityContract } from '@pokemongonexus/shared-ui-tokens';
import { AccessibilityInfo, Animated } from 'react-native';
import {
  resolveNativeOverlaySwipeDirection,
  shouldCaptureNativeOverlaySwipe,
  useNativeOverlaySwipeNavigation,
} from '../../../../src/features/collection/parity/useNativeOverlaySwipeNavigation';

describe('native instance overlay swipe navigation', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uses the canonical overlay navigation threshold', () => {
    const threshold = collectionExperienceParityContract.instanceOverlaySwipe.navigationDelta;
    expect(resolveNativeOverlaySwipeDirection({ deltaX: -(threshold - 1), deltaY: 0 })).toBeNull();
    expect(resolveNativeOverlaySwipeDirection({ deltaX: -threshold, deltaY: 0 })).toBe('next');
    expect(resolveNativeOverlaySwipeDirection({ deltaX: threshold, deltaY: 0 })).toBe('previous');
  });

  it('does not steal vertical scrolling from the detail sheet', () => {
    expect(shouldCaptureNativeOverlaySwipe({ deltaX: 9, deltaY: 0 })).toBe(false);
    expect(shouldCaptureNativeOverlaySwipe({ deltaX: 20, deltaY: 40 })).toBe(false);
    expect(shouldCaptureNativeOverlaySwipe({ deltaX: 40, deltaY: 20 })).toBe(true);
    expect(resolveNativeOverlaySwipeDirection({ deltaX: 70, deltaY: 100 })).toBeNull();
  });

  it('does not slide the outgoing instance back in before the target instance is committed', async () => {
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
    const { result, rerender, unmount } = renderHook<
      ReturnType<typeof useNativeOverlaySwipeNavigation>,
      { activeItemKey: string }
    >(
      ({ activeItemKey }) => useNativeOverlaySwipeNavigation({ activeItemKey, onNext }),
      { initialProps: { activeItemKey: 'instance-1' } },
    );

    await act(async () => Promise.resolve());

    act(() => {
      result.current.navigateNext();
    });
    expect(animationCompletions).toHaveLength(1);

    act(() => animationCompletions.shift()?.({ finished: true }));
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(animationCompletions).toHaveLength(0);
    expect(result.current.isAnimating).toBe(true);

    rerender({ activeItemKey: 'instance-2' });
    expect(animationCompletions).toHaveLength(1);
    act(() => animationCompletions.shift()?.({ finished: true }));
    expect(result.current.isAnimating).toBe(false);

    animationFrame.mockRestore();
    unmount();
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
    jest.spyOn(global, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    const onNext = jest.fn();
    const onPrevious = jest.fn();
    const { result, rerender, unmount } = renderHook<
      ReturnType<typeof useNativeOverlaySwipeNavigation>,
      { activeItemKey: string }
    >(
      ({ activeItemKey }) => useNativeOverlaySwipeNavigation({
        activeItemKey,
        onNext,
        onPrevious,
      }),
      { initialProps: { activeItemKey: 'instance-1' } },
    );

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
    expect(animationCompletions).toHaveLength(0);

    rerender({ activeItemKey: 'instance-2' });
    act(() => animationCompletions.shift()?.({ finished: true }));
    expect(animationCompletions).toHaveLength(1);

    act(() => animationCompletions.shift()?.({ finished: true }));
    expect(onPrevious).toHaveBeenCalledTimes(1);
    expect(animationCompletions).toHaveLength(0);

    rerender({ activeItemKey: 'instance-1' });
    act(() => animationCompletions.shift()?.({ finished: true }));
    unmount();
  });
});
