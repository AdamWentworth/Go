import {
  AccessibilityInfo,
  Animated,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  Children,
  forwardRef,
  type PropsWithChildren,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { useOptionalNativeDevicePreferences } from '../features/settings/NativeDevicePreferencesProvider';

type Props = PropsWithChildren<{
  activeIndex: number;
  onIndexChange: (index: number) => void;
  scrollX?: Animated.Value;
}>;

export type NativeHorizontalPageSliderHandle = {
  setPage: (index: number, animated?: boolean) => void;
};

const clampPageIndex = (index: number, panelCount: number): number =>
  Math.max(0, Math.min(index, Math.max(0, panelCount - 1)));

export const resolveNativeHorizontalPageOffset = ({
  offsetX,
  panelCount,
  width,
}: {
  offsetX: number;
  panelCount: number;
  width: number;
}): number => clampPageIndex(
  width > 0 ? Math.round(offsetX / width) : 0,
  panelCount,
);

export const NativeHorizontalPageSlider = forwardRef<
  NativeHorizontalPageSliderHandle,
  Props
>(function NativeHorizontalPageSlider({
  activeIndex,
  children,
  onIndexChange,
  scrollX,
}, ref) {
  const panels = Children.toArray(children);
  const panelCount = panels.length;
  const { width } = useWindowDimensions();
  const safeIndex = clampPageIndex(activeIndex, panelCount);
  const scrollRef = useRef<ScrollView>(null);
  const renderedIndexRef = useRef(safeIndex);
  const previousWidthRef = useRef(width);
  const [internalScrollX] = useState(() => new Animated.Value(safeIndex * width));
  const pageScrollX = scrollX ?? internalScrollX;
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

  const setPage = useCallback((index: number, animated = !reduceMotion) => {
    const nextIndex = clampPageIndex(index, panelCount);
    renderedIndexRef.current = nextIndex;
    scrollRef.current?.scrollTo({
      x: nextIndex * width,
      y: 0,
      animated,
    });
  }, [panelCount, reduceMotion, width]);

  useImperativeHandle(ref, () => ({ setPage }), [setPage]);

  useEffect(() => {
    if (renderedIndexRef.current !== safeIndex) setPage(safeIndex);
  }, [safeIndex, setPage]);

  useEffect(() => {
    // Preserve the selected page across rotations without animating from the old width.
    if (previousWidthRef.current === width) return;
    previousWidthRef.current = width;
    setPage(safeIndex, false);
  }, [safeIndex, setPage, width]);

  return (
    <Animated.ScrollView
      bounces={false}
      contentOffset={{ x: safeIndex * width, y: 0 }}
      decelerationRate="fast"
      directionalLockEnabled
      horizontal
      nestedScrollEnabled
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { x: pageScrollX } } }],
        { useNativeDriver: true },
      )}
      onMomentumScrollEnd={(event) => {
        const nextIndex = resolveNativeHorizontalPageOffset({
          offsetX: event.nativeEvent.contentOffset.x,
          panelCount,
          width,
        });
        renderedIndexRef.current = nextIndex;
        if (nextIndex !== safeIndex) onIndexChange(nextIndex);
      }}
      pagingEnabled
      ref={scrollRef}
      scrollEventThrottle={16}
      showsHorizontalScrollIndicator={false}
      style={styles.viewport}
      testID="native-horizontal-page-slider"
    >
      {panels.map((panel, index) => (
        <View
          accessibilityElementsHidden={index !== safeIndex}
          importantForAccessibility={index === safeIndex ? 'auto' : 'no-hide-descendants'}
          key={index}
          pointerEvents={index === safeIndex ? 'auto' : 'none'}
          style={[styles.panel, { width }]}
          testID={`native-horizontal-page-${index}`}
        >
          {panel}
        </View>
      ))}
    </Animated.ScrollView>
  );
});

const styles = StyleSheet.create({
  viewport: { flex: 1, minHeight: 0 },
  panel: { flex: 1, minHeight: 0 },
});
