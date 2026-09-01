import {
  AccessibilityInfo,
  Animated,
  Easing,
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
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { collectionExperienceParityContract } from '@pokemongonexus/shared-ui-tokens';
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
// This value is deliberately shared by the track transform and any header
// indicator consuming `scrollX`; one native-driven clock keeps the underline
// and page body together.
export const NATIVE_HORIZONTAL_PAGE_TRANSITION_MS = (
  collectionExperienceParityContract.pageTransitionMs
);

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
  const renderedIndexRef = useRef(safeIndex);
  const alignedInitialPageRef = useRef(false);
  const previousWidthRef = useRef(width);
  const dragStartOffsetRef = useRef(safeIndex * width);
  const [internalScrollX] = useState(() => new Animated.Value(safeIndex * width));
  const pageScrollX = scrollX ?? internalScrollX;
  const devicePreferences = useOptionalNativeDevicePreferences();
  const systemReduceMotionRef = useRef(false);
  const [systemReduceMotion, setSystemReduceMotion] = useState(false);

  const updateSystemReduceMotion = useCallback((enabled: boolean) => {
    if (systemReduceMotionRef.current === enabled) return;
    systemReduceMotionRef.current = enabled;
    setSystemReduceMotion(enabled);
  }, []);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(updateSystemReduceMotion);
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      updateSystemReduceMotion,
    );
    return () => subscription.remove();
  }, [updateSystemReduceMotion]);

  const reduceMotion = devicePreferences?.shouldReduceMotion ?? systemReduceMotion;

  const setPage = useCallback((index: number, animated = !reduceMotion) => {
    const nextIndex = clampPageIndex(index, panelCount);
    renderedIndexRef.current = nextIndex;
    // Vite moves one three-panel track. Drive the native track and every header
    // indicator from this same value so Android cannot make the body and
    // underline race each other with two different animation clocks.
    pageScrollX.stopAnimation();
    if (animated) {
      Animated.timing(pageScrollX, {
        duration: NATIVE_HORIZONTAL_PAGE_TRANSITION_MS,
        easing: Easing.bezier(...collectionExperienceParityContract.pageTransitionEasing),
        toValue: nextIndex * width,
        useNativeDriver: true,
      }).start();
    } else {
      pageScrollX.setValue(nextIndex * width);
    }
  }, [pageScrollX, panelCount, reduceMotion, width]);

  useImperativeHandle(ref, () => ({ setPage }), [setPage]);

  useLayoutEffect(() => {
    // Align before paint when a caller supplies its own shared progress value.
    if (!alignedInitialPageRef.current) {
      alignedInitialPageRef.current = true;
      setPage(safeIndex, false);
      return;
    }
    if (renderedIndexRef.current !== safeIndex) setPage(safeIndex);
  }, [safeIndex, setPage]);

  useLayoutEffect(() => {
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
    })
    .onEnd((event) => settleDrag(event.translationX, event.velocityX)), [
      pageScrollX,
      panelCount,
      settleDrag,
      width,
    ]);

  return (
    <GestureDetector gesture={pageGesture}>
      <View style={styles.viewport} testID="native-horizontal-page-slider">
        <Animated.View
          renderToHardwareTextureAndroid
          shouldRasterizeIOS
          style={[
            styles.track,
            {
              transform: [{ translateX: Animated.multiply(pageScrollX, -1) }],
              width: width * panelCount,
            },
          ]}
          testID="native-horizontal-page-track"
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
        </Animated.View>
      </View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  viewport: { flex: 1, minHeight: 0, overflow: 'hidden' },
  track: { flex: 1, flexDirection: 'row', minHeight: 0 },
  panel: { minHeight: 0 },
});
