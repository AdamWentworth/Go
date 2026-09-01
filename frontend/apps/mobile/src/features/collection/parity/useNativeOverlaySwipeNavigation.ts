import {
  AccessibilityInfo,
  Animated,
  Easing,
} from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import { collectionExperienceParityContract } from '@pokemongonexus/shared-ui-tokens';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useOptionalNativeDevicePreferences } from '../../settings/NativeDevicePreferencesProvider';

export type NativeOverlaySwipeDirection = 'previous' | 'next';

const { instanceOverlaySwipe } = collectionExperienceParityContract;
const ROUTE_HANDOFF_TIMEOUT_MS = 1000;
const swipeEasing = Easing.bezier(...instanceOverlaySwipe.transitionEasing);

export const resolveNativeOverlaySwipeDirection = ({
  deltaX,
  deltaY,
}: {
  deltaX: number;
  deltaY: number;
}): NativeOverlaySwipeDirection | null => {
  if (Math.abs(deltaX) < instanceOverlaySwipe.navigationDelta) return null;
  if (Math.abs(deltaX) < Math.abs(deltaY) * 0.9) return null;
  return deltaX < 0 ? 'next' : 'previous';
};

export const shouldCaptureNativeOverlaySwipe = ({
  deltaX,
  deltaY,
}: {
  deltaX: number;
  deltaY: number;
}): boolean => (
  Math.abs(deltaX) >= instanceOverlaySwipe.axisLockDelta
  && Math.abs(deltaX) >= Math.abs(deltaY) * 0.9
);

const clampDragOffset = (deltaX: number): number => (
  Math.max(
    -instanceOverlaySwipe.maxDragOffset,
    Math.min(instanceOverlaySwipe.maxDragOffset, deltaX),
  )
);

type Args = {
  activeItemKey: string | null;
  disabled?: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
};

type Result = {
  isAnimating: boolean;
  motionStyle: { transform: { translateX: Animated.Value }[] };
  navigateNext: () => void;
  navigatePrevious: () => void;
  gesture: ReturnType<typeof Gesture.Pan>;
};

export const useNativeOverlaySwipeNavigation = ({
  activeItemKey,
  disabled = false,
  onNext,
  onPrevious,
}: Args): Result => {
  const [translateX] = useState(() => new Animated.Value(0));
  const [isAnimating, setIsAnimating] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<NativeOverlaySwipeDirection | null>(null);
  const isAnimatingRef = useRef(false);
  const activeAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const entranceFrameRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);
  const routeHandoffTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const awaitingContentRef = useRef<{
    direction: NativeOverlaySwipeDirection;
    outgoingKey: string | null;
  } | null>(null);
  const devicePreferences = useOptionalNativeDevicePreferences();
  const [systemReduceMotion, setSystemReduceMotion] = useState(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setSystemReduceMotion);
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setSystemReduceMotion,
    );
    return () => subscription.remove();
  }, []);

  const reduceMotion = devicePreferences?.shouldReduceMotion ?? systemReduceMotion;

  const finishNavigation = useCallback(() => {
    isAnimatingRef.current = false;
    setIsAnimating(false);
  }, []);

  const startEntrance = useCallback((direction: NativeOverlaySwipeDirection) => {
    if (routeHandoffTimerRef.current !== null) {
      clearTimeout(routeHandoffTimerRef.current);
      routeHandoffTimerRef.current = null;
    }
    awaitingContentRef.current = null;

    const enterOffset = direction === 'next'
      ? instanceOverlaySwipe.enterOffset
      : -instanceOverlaySwipe.enterOffset;
    translateX.setValue(enterOffset);
    entranceFrameRef.current = requestAnimationFrame(() => {
      entranceFrameRef.current = null;
      const animation = Animated.timing(translateX, {
        toValue: 0,
        duration: instanceOverlaySwipe.entryTransitionMs,
        easing: swipeEasing,
        useNativeDriver: true,
      });
      activeAnimationRef.current = animation;
      animation.start(() => {
        activeAnimationRef.current = null;
        finishNavigation();
      });
    });
  }, [finishNavigation, translateX]);

  useLayoutEffect(() => {
    const awaitingContent = awaitingContentRef.current;
    if (
      !awaitingContent
      || !activeItemKey
      || activeItemKey === awaitingContent.outgoingKey
    ) return;

    startEntrance(awaitingContent.direction);
  }, [activeItemKey, startEntrance]);

  useEffect(() => () => {
    activeAnimationRef.current?.stop();
    if (entranceFrameRef.current !== null) {
      cancelAnimationFrame(entranceFrameRef.current);
    }
    if (routeHandoffTimerRef.current !== null) {
      clearTimeout(routeHandoffTimerRef.current);
    }
    translateX.stopAnimation();
  }, [translateX]);

  const resetPosition = useCallback(() => {
    if (reduceMotion) {
      translateX.setValue(0);
      return;
    }
    Animated.spring(translateX, {
      toValue: 0,
      damping: 22,
      stiffness: 240,
      mass: 0.7,
      useNativeDriver: true,
    }).start();
  }, [reduceMotion, translateX]);

  const navigate = useCallback((direction: NativeOverlaySwipeDirection) => {
    if (disabled) return;
    if (isAnimatingRef.current) {
      setPendingNavigation(direction);
      return;
    }
    const callback = direction === 'next' ? onNext : onPrevious;
    if (!callback) {
      resetPosition();
      return;
    }

    if (reduceMotion) {
      translateX.setValue(0);
      callback();
      return;
    }

    isAnimatingRef.current = true;
    setIsAnimating(true);
    const exitOffset = direction === 'next'
      ? -instanceOverlaySwipe.exitOffset
      : instanceOverlaySwipe.exitOffset;
    const animation = Animated.timing(translateX, {
      toValue: exitOffset,
      duration: instanceOverlaySwipe.swapDelayMs,
      easing: swipeEasing,
      useNativeDriver: true,
    });
    activeAnimationRef.current = animation;
    animation.start(({ finished }) => {
      activeAnimationRef.current = null;
      if (!finished) {
        finishNavigation();
        resetPosition();
        return;
      }

      // Expo Router commits setParams asynchronously. Keep the outgoing item
      // offscreen until the screen confirms that the target item replaced it;
      // otherwise the old item visibly slides back in before the route updates.
      awaitingContentRef.current = {
        direction,
        outgoingKey: activeItemKey,
      };
      callback();
      routeHandoffTimerRef.current = setTimeout(() => {
        const awaitingContent = awaitingContentRef.current;
        if (awaitingContent) startEntrance(awaitingContent.direction);
      }, ROUTE_HANDOFF_TIMEOUT_MS);
    });
  }, [
    activeItemKey,
    disabled,
    finishNavigation,
    onNext,
    onPrevious,
    reduceMotion,
    resetPosition,
    startEntrance,
    translateX,
  ]);

  useEffect(() => {
    if (isAnimating || !pendingNavigation) return undefined;
    const direction = pendingNavigation;
    const frame = requestAnimationFrame(() => {
      setPendingNavigation(null);
      navigate(direction);
    });
    return () => cancelAnimationFrame(frame);
  }, [isAnimating, navigate, pendingNavigation]);

  const gesture = useMemo(() => Gesture.Pan()
    .enabled(!disabled && !isAnimating && Boolean(onNext || onPrevious))
    // Require a deliberate horizontal drag and fail immediately once the user
    // establishes vertical intent. A generic minDistance gesture activates on
    // vertical swipes too and starves the overlay's ScrollViews on Android.
    .activeOffsetX([
      -instanceOverlaySwipe.axisLockDelta,
      instanceOverlaySwipe.axisLockDelta,
    ])
    .failOffsetY([
      -instanceOverlaySwipe.axisLockDelta,
      instanceOverlaySwipe.axisLockDelta,
    ])
    .runOnJS(true)
    .onBegin(() => {
      translateX.stopAnimation();
    })
    .onUpdate((event) => {
      if (!shouldCaptureNativeOverlaySwipe({
        deltaX: event.translationX,
        deltaY: event.translationY,
      })) return;
      const movingNext = event.translationX < 0;
      const hasDestination = movingNext
        ? Boolean(onNext)
        : Boolean(onPrevious);
      const offset = clampDragOffset(event.translationX);
      translateX.setValue(hasDestination ? offset : offset * 0.24);
    })
    // Gesture Handler stores this worklet callback for a future native event;
    // it does not invoke navigate (or read its refs) during React render.
    // eslint-disable-next-line react-hooks/refs
    .onEnd((event) => {
      const direction = resolveNativeOverlaySwipeDirection({
        deltaX: event.translationX,
        deltaY: event.translationY,
      });
      if (direction) navigate(direction);
      else resetPosition();
    })
    .onFinalize((_event, success) => {
      if (!success) resetPosition();
    }), [disabled, isAnimating, navigate, onNext, onPrevious, resetPosition, translateX]);

  return {
    gesture,
    isAnimating,
    motionStyle: { transform: [{ translateX }] },
    navigateNext: () => navigate('next'),
    navigatePrevious: () => navigate('previous'),
  };
};
