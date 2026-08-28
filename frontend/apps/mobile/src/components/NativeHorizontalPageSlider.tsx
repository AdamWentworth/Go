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

// Keep programmatic tab changes in step with the canonical Vite page slide.
// This value is deliberately shared by the content offset and any header
// indicator consuming `scrollX`; changing it in one place prevents the tab
// underline from jumping ahead of the page body on native platforms.
export const NATIVE_HORIZONTAL_PAGE_TRANSITION_MS = 240;

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
  const alignedInitialPageRef = useRef(false);
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
    // Android does not consistently emit a complete Animated onScroll sequence
    // for programmatic scrollTo calls. Drive the shared progress value in
    // parallel so the page and its coordinated header indicator move together
    // instead of snapping to different states.
    pageScrollX.stopAnimation();
    if (animated) {
      Animated.timing(pageScrollX, {
        duration: NATIVE_HORIZONTAL_PAGE_TRANSITION_MS,
        easing: undefined,
        toValue: nextIndex * width,
        useNativeDriver: true,
      }).start();
    } else {
      pageScrollX.setValue(nextIndex * width);
    }
    scrollRef.current?.scrollTo({
      x: nextIndex * width,
      y: 0,
      animated,
    });
  }, [pageScrollX, panelCount, reduceMotion, width]);

  useImperativeHandle(ref, () => ({ setPage }), [setPage]);

  useEffect(() => {
    // `contentOffset` establishes the first page on iOS and Android, but
    // react-native-web does not consistently apply it during hydration. Make
    // the initial alignment explicit after the ref exists so the visible body
    // can never disagree with the selected tab or underline.
    if (!alignedInitialPageRef.current) {
      alignedInitialPageRef.current = true;
      setPage(safeIndex, false);
      return;
    }
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
          aria-hidden={index !== safeIndex}
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
