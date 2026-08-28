import {
  AccessibilityInfo,
  Animated,
} from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useOptionalNativeDevicePreferences } from '../../settings/NativeDevicePreferencesProvider';

export type NativeOverlaySwipeDirection = 'previous' | 'next';

const AXIS_LOCK_DELTA = 10;
const NAVIGATION_DELTA = 56;
const MAX_DRAG_OFFSET = 180;

export const resolveNativeOverlaySwipeDirection = ({
  deltaX,
  deltaY,
}: {
  deltaX: number;
  deltaY: number;
}): NativeOverlaySwipeDirection | null => {
  if (Math.abs(deltaX) < NAVIGATION_DELTA) return null;
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
  Math.abs(deltaX) >= AXIS_LOCK_DELTA
  && Math.abs(deltaX) >= Math.abs(deltaY) * 0.9
);

const clampDragOffset = (deltaX: number): number => (
  Math.max(-MAX_DRAG_OFFSET, Math.min(MAX_DRAG_OFFSET, deltaX))
);

type Args = {
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
  disabled = false,
  onNext,
  onPrevious,
}: Args): Result => {
  const [translateX] = useState(() => new Animated.Value(0));
  const [isAnimating, setIsAnimating] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<NativeOverlaySwipeDirection | null>(null);
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

  useEffect(() => () => {
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
    if (isAnimating) {
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

    setIsAnimating(true);
    const finishNavigation = () => {
      setIsAnimating(false);
    };
    const exitOffset = direction === 'next' ? -140 : 140;
    const enterOffset = direction === 'next' ? 110 : -110;
    Animated.timing(translateX, {
      toValue: exitOffset,
      duration: 120,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        finishNavigation();
        resetPosition();
        return;
      }
      callback();
      translateX.setValue(enterOffset);
      Animated.timing(translateX, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start(() => {
        finishNavigation();
      });
    });
  }, [disabled, isAnimating, onNext, onPrevious, reduceMotion, resetPosition, translateX]);

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
    .minDistance(AXIS_LOCK_DELTA)
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
