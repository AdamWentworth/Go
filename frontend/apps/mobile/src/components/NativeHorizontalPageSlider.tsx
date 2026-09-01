import {
  AccessibilityInfo,
  Animated,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  Children,
  forwardRef,
  type PropsWithChildren,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
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
  const dragStartOffsetRef = useRef(safeIndex * width);
  const [mountedIndexes, setMountedIndexes] = useState<Set<number>>(
    () => new Set([safeIndex]),
  );
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

  useEffect(() => {
    setMountedIndexes((current) => {
      if (current.has(safeIndex)) return current;
      const next = new Set(current);
      next.add(safeIndex);
      return next;
    });
  }, [safeIndex]);

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

  const settleDrag = useCallback((translationX: number, velocityX: number) => {
    const currentIndex = renderedIndexRef.current;
    const projectedTranslation = translationX + (velocityX * 0.08);
    const shouldChangePage = Math.abs(projectedTranslation) >= Math.max(54, width * 0.16);
    const requestedIndex = shouldChangePage
      ? currentIndex + (projectedTranslation < 0 ? 1 : -1)
      : currentIndex;
    const nextIndex = clampPageIndex(requestedIndex, panelCount);
    setPage(nextIndex);
    if (nextIndex !== safeIndex) onIndexChange(nextIndex);
  }, [onIndexChange, panelCount, safeIndex, setPage, width]);

  const pageGesture = useMemo(() => Gesture.Pan()
    .enabled(panelCount > 1)
    // Do not let a page swipe enter BEGAN/ACTIVE during a vertical list drag.
    // Android's nested ScrollView responder otherwise steals diagonal swipes
    // from FlatList children before they can establish vertical direction.
    .activeOffsetX([-18, 18])
    .failOffsetY([-10, 10])
    .runOnJS(true)
    .onStart(() => {
      setMountedIndexes((current) => {
        const next = new Set(current);
        next.add(renderedIndexRef.current);
        if (renderedIndexRef.current > 0) next.add(renderedIndexRef.current - 1);
        if (renderedIndexRef.current < panelCount - 1) {
          next.add(renderedIndexRef.current + 1);
        }
        return next;
      });
      dragStartOffsetRef.current = renderedIndexRef.current * width;
      pageScrollX.stopAnimation();
    })
    .onUpdate((event) => {
      const maxOffset = Math.max(0, (panelCount - 1) * width);
      const offset = Math.max(
        0,
        Math.min(maxOffset, dragStartOffsetRef.current - event.translationX),
      );
      pageScrollX.setValue(offset);
      scrollRef.current?.scrollTo({ animated: false, x: offset, y: 0 });
    })
    .onEnd((event) => settleDrag(event.translationX, event.velocityX)), [
      pageScrollX,
      panelCount,
      settleDrag,
      width,
    ]);

  return (
    <GestureDetector gesture={pageGesture}>
      <Animated.ScrollView
      bounces={false}
      contentOffset={{ x: safeIndex * width, y: 0 }}
      decelerationRate="fast"
      directionalLockEnabled
      horizontal
      keyboardShouldPersistTaps="always"
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
      scrollEnabled={false}
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
            {mountedIndexes.has(index) || index === safeIndex ? panel : null}
          </View>
        ))}
      </Animated.ScrollView>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  viewport: { flex: 1, minHeight: 0 },
  panel: { flex: 1, minHeight: 0 },
});
