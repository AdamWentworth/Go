import {
  AccessibilityInfo,
  Animated,
  Easing,
  PanResponder,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  Children,
  type PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

type Props = PropsWithChildren<{
  activeIndex: number;
  onIndexChange: (index: number) => void;
}>;

const PAGE_DURATION_MS = 300;
const PAGE_EASING = Easing.bezier(0.25, 0.46, 0.45, 0.94);

export const resolveNativeHorizontalPageSwipe = ({
  currentIndex,
  distanceX,
  panelCount,
  velocityX,
  width,
}: {
  currentIndex: number;
  distanceX: number;
  panelCount: number;
  velocityX: number;
  width: number;
}): number => {
  const crossesDistance = Math.abs(distanceX) >= width * 0.18;
  const crossesVelocity = Math.abs(velocityX) >= 0.55;
  if (!crossesDistance && !crossesVelocity) return currentIndex;
  return Math.max(
    0,
    Math.min(currentIndex + (distanceX < 0 ? 1 : -1), panelCount - 1),
  );
};

export const NativeHorizontalPageSlider = ({
  activeIndex,
  children,
  onIndexChange,
}: Props) => {
  const panels = Children.toArray(children);
  const panelCount = panels.length;
  const { width } = useWindowDimensions();
  const safeIndex = Math.max(0, Math.min(activeIndex, panelCount - 1));
  const [translateX] = useState(() => new Animated.Value(-safeIndex * width));
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: -safeIndex * width,
      duration: reduceMotion ? 0 : PAGE_DURATION_MS,
      easing: PAGE_EASING,
      useNativeDriver: true,
    }).start();
  }, [reduceMotion, safeIndex, translateX, width]);

  const settle = useCallback((index: number) => {
    const nextIndex = Math.max(0, Math.min(index, panelCount - 1));
    if (nextIndex !== safeIndex) {
      onIndexChange(nextIndex);
      return;
    }
    Animated.timing(translateX, {
      toValue: -nextIndex * width,
      duration: reduceMotion ? 0 : PAGE_DURATION_MS,
      easing: PAGE_EASING,
      useNativeDriver: true,
    }).start();
  }, [onIndexChange, panelCount, reduceMotion, safeIndex, translateX, width]);

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_event, gesture) =>
      Math.abs(gesture.dx) > 12
      && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.2,
    onPanResponderGrant: () => translateX.stopAnimation(),
    onPanResponderMove: (_event, gesture) => {
      const base = -safeIndex * width;
      const min = -(panelCount - 1) * width;
      const resistance = 0.22;
      const proposed = base + gesture.dx;
      const restrained = proposed > 0
        ? proposed * resistance
        : proposed < min
          ? min + (proposed - min) * resistance
          : proposed;
      translateX.setValue(restrained);
    },
    onPanResponderRelease: (_event, gesture) => {
      settle(resolveNativeHorizontalPageSwipe({
        currentIndex: safeIndex,
        distanceX: gesture.dx,
        panelCount,
        velocityX: gesture.vx,
        width,
      }));
    },
    onPanResponderTerminate: () => settle(safeIndex),
  }), [panelCount, safeIndex, settle, translateX, width]);

  return (
    <View
      {...panResponder.panHandlers}
      style={styles.viewport}
      testID="native-horizontal-page-slider"
    >
      <Animated.View
        style={[
          styles.track,
          {
            width: width * panelCount,
            transform: [{ translateX }],
          },
        ]}
        testID="native-horizontal-page-track"
      >
        {panels.map((panel, index) => (
          <View
            accessibilityElementsHidden={index !== safeIndex}
            importantForAccessibility={index === safeIndex ? 'auto' : 'no-hide-descendants'}
            key={index}
            pointerEvents={index === safeIndex ? 'auto' : 'none'}
            style={[styles.panel, { width }]}
          >
            {panel}
          </View>
        ))}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  viewport: { flex: 1, minHeight: 0, overflow: 'hidden' },
  track: { flex: 1, minHeight: 0, flexDirection: 'row' },
  panel: { flex: 1, minHeight: 0 },
});
