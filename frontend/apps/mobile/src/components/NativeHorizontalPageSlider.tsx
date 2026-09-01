import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  PanGestureHandler,
  State,
  type PanGestureHandlerStateChangeEvent,
} from 'react-native-gesture-handler';
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
  dragX?: Animated.Value;
}>;

export type NativeHorizontalPageSliderHandle = {
  preparePage: (index: number) => void;
  setPage: (index: number, animated?: boolean) => void;
};

// Keep programmatic tab changes in step with the canonical Vite page slide.
// This value is deliberately shared by the track transform and any header
// indicator consuming `scrollX`; one native-driven clock keeps the underline
// and page body together.
export const NATIVE_HORIZONTAL_PAGE_TRANSITION_MS = (
  collectionExperienceParityContract.pageTransitionMs
);
const NATIVE_HORIZONTAL_PAGE_EASING = Easing.bezier(
  ...collectionExperienceParityContract.pageTransitionEasing,
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

export const resolveNativeHorizontalSwipeIndex = ({
  currentIndex,
  panelCount,
  translationX,
}: {
  currentIndex: number;
  panelCount: number;
  translationX: number;
}): number => {
  if (Math.abs(translationX) <= collectionExperienceParityContract.pageSwipeThresholdPx) {
    return clampPageIndex(currentIndex, panelCount);
  }
  return clampPageIndex(
    currentIndex + (translationX < 0 ? 1 : -1),
    panelCount,
  );
};

export const resolveNativeHorizontalDragHandoffOffset = ({
  baseOffset,
  maxPeekDistance,
  translationX,
}: {
  baseOffset: number;
  maxPeekDistance: number;
  translationX: number;
}): number => baseOffset - Math.max(
  -maxPeekDistance,
  Math.min(maxPeekDistance, translationX),
);

export const NativeHorizontalPageSlider = forwardRef<
  NativeHorizontalPageSliderHandle,
  Props
>(function NativeHorizontalPageSlider({
  activeIndex,
  children,
  onIndexChange,
  scrollX,
  dragX,
}, ref) {
  const panels = Children.toArray(children);
  const panelCount = panels.length;
  const { width } = useWindowDimensions();
  const safeIndex = clampPageIndex(activeIndex, panelCount);
  const safeIndexRef = useRef(safeIndex);
  const onIndexChangeRef = useRef(onIndexChange);
  const trackRef = useRef<View>(null);
  const renderedIndexRef = useRef(safeIndex);
  const alignedInitialPageRef = useRef(false);
  const previousWidthRef = useRef(width);
  const dragStartOffsetRef = useRef(safeIndex * width);
  const [internalScrollX] = useState(() => new Animated.Value(safeIndex * width));
  const pageScrollX = scrollX ?? internalScrollX;
  const maxPeekDistance = width * collectionExperienceParityContract.pageSwipeMaxPeekRatio;
  const nativeDrivenDrag = dragX && Platform.OS !== 'web' ? dragX : null;
  const clampedNativeDrag = useMemo(
    () => nativeDrivenDrag
      ? Animated.diffClamp(nativeDrivenDrag, -maxPeekDistance, maxPeekDistance)
      : null,
    [maxPeekDistance, nativeDrivenDrag],
  );
  const renderedScrollX = useMemo(
    () => clampedNativeDrag
      ? Animated.add(pageScrollX, Animated.multiply(clampedNativeDrag, -1))
      : pageScrollX,
    [clampedNativeDrag, pageScrollX],
  );
  const trackTranslateX = useMemo(
    () => Animated.multiply(renderedScrollX, -1),
    [renderedScrollX],
  );
  const trackStyle = useMemo(() => [
    styles.track,
    {
      transform: [{ translateX: trackTranslateX }],
      width: width * panelCount,
    },
  ], [panelCount, trackTranslateX, width]);
  const panelStyle = useMemo(() => [styles.panel, { width }], [width]);
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

  const setTrackRasterized = useCallback((enabled: boolean) => {
    // React Native Web exposes the host DOM node here rather than a native
    // component handle. GPU layer hints are only useful on the device and its
    // host node does not implement setNativeProps.
    if (Platform.OS === 'web') return;
    trackRef.current?.setNativeProps({
      renderToHardwareTextureAndroid: enabled,
      shouldRasterizeIOS: enabled,
    });
  }, []);

  const setPage = useCallback((index: number, animated = !reduceMotion) => {
    const nextIndex = clampPageIndex(index, panelCount);
    renderedIndexRef.current = nextIndex;
    // Vite moves one three-panel track. Drive the native track and every header
    // indicator from this same value so Android cannot make the body and
    // underline race each other with two different animation clocks.
    nativeDrivenDrag?.stopAnimation();
    nativeDrivenDrag?.setValue(0);
    pageScrollX.stopAnimation();
    if (animated) {
      setTrackRasterized(true);
      Animated.timing(pageScrollX, {
        duration: NATIVE_HORIZONTAL_PAGE_TRANSITION_MS,
        easing: NATIVE_HORIZONTAL_PAGE_EASING,
        isInteraction: true,
        toValue: nextIndex * width,
        useNativeDriver: true,
      }).start(() => setTrackRasterized(false));
    } else {
      setTrackRasterized(false);
      pageScrollX.setValue(nextIndex * width);
    }
  }, [nativeDrivenDrag, pageScrollX, panelCount, reduceMotion, setTrackRasterized, width]);

  const preparePage = useCallback((index: number) => {
    // A caller that has just changed offscreen content can reserve the
    // destination before React's layout effects run, then launch motion on the
    // following frame after Android has had one paint opportunity. This keeps
    // the activeIndex effect from starting an eager duplicate animation.
    renderedIndexRef.current = clampPageIndex(index, panelCount);
    if (!reduceMotion) setTrackRasterized(true);
  }, [panelCount, reduceMotion, setTrackRasterized]);

  useImperativeHandle(ref, () => ({ preparePage, setPage }), [preparePage, setPage]);

  useLayoutEffect(() => {
    safeIndexRef.current = safeIndex;
    onIndexChangeRef.current = onIndexChange;
  }, [onIndexChange, safeIndex]);

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

  const settleDrag = useCallback((translationX: number, _velocityX: number) => {
    const currentIndex = renderedIndexRef.current;
    const nextIndex = resolveNativeHorizontalSwipeIndex({
      currentIndex,
      panelCount,
      translationX,
    });
    setPage(nextIndex);
    if (nextIndex !== safeIndexRef.current) onIndexChangeRef.current(nextIndex);
  }, [panelCount, setPage]);

  const nativePanEvent = useMemo(() => nativeDrivenDrag
    ? Animated.event(
        [{ nativeEvent: { translationX: nativeDrivenDrag } }],
        { useNativeDriver: true },
      )
    : undefined, [nativeDrivenDrag]);
  const handleNativePanStateChange = useCallback((
    event: PanGestureHandlerStateChangeEvent,
  ) => {
    if (!nativeDrivenDrag) return;
    const { oldState, state, translationX, velocityX } = event.nativeEvent;
    if (state === State.ACTIVE) {
      dragStartOffsetRef.current = renderedIndexRef.current * width;
      pageScrollX.stopAnimation((currentOffset) => {
        dragStartOffsetRef.current = currentOffset;
        pageScrollX.setValue(currentOffset);
        nativeDrivenDrag.setValue(0);
      });
      setTrackRasterized(true);
      return;
    }
    if (oldState === State.ACTIVE) {
      // Transfer the native drag position into the settled page value before
      // releasing the gesture value. The track therefore continues from the
      // finger position instead of flashing back to the current page first.
      pageScrollX.setValue(resolveNativeHorizontalDragHandoffOffset({
        baseOffset: dragStartOffsetRef.current,
        maxPeekDistance,
        translationX,
      }));
      nativeDrivenDrag.setValue(0);
      if (state === State.END) settleDrag(translationX, velocityX);
      else setPage(renderedIndexRef.current);
      return;
    }
  }, [
    maxPeekDistance,
    nativeDrivenDrag,
    pageScrollX,
    setPage,
    setTrackRasterized,
    settleDrag,
    width,
  ]);

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
      setTrackRasterized(true);
    })
    .onUpdate((event) => {
      const maxOffset = Math.max(0, (panelCount - 1) * width);
      const offset = Math.max(
        0,
        Math.min(maxOffset, dragStartOffsetRef.current - event.translationX),
      );
      pageScrollX.setValue(offset);
    })
    .onEnd((event) => settleDrag(event.translationX, event.velocityX))
    .onFinalize((_event, success) => {
      if (!success) setPage(renderedIndexRef.current);
    }), [
      pageScrollX,
      panelCount,
      setTrackRasterized,
      setPage,
      settleDrag,
      width,
    ]);

  const viewport = (
    <Animated.View style={styles.viewport} testID="native-horizontal-page-slider">
      <Animated.View
        ref={trackRef}
        renderToHardwareTextureAndroid={false}
        shouldRasterizeIOS={false}
        style={trackStyle}
        testID="native-horizontal-page-track"
      >
        {panels.map((panel, index) => (
          <View
            accessibilityElementsHidden={index !== safeIndex}
            aria-hidden={index !== safeIndex}
            importantForAccessibility={index === safeIndex ? 'auto' : 'no-hide-descendants'}
            key={index}
            pointerEvents={index === safeIndex ? 'auto' : 'none'}
            style={panelStyle}
            testID={`native-horizontal-page-${index}`}
          >
            {panel}
          </View>
        ))}
      </Animated.View>
    </Animated.View>
  );

  if (nativeDrivenDrag && nativePanEvent) {
    return (
      <PanGestureHandler
        activeOffsetX={[-18, 18]}
        enabled={panelCount > 1}
        failOffsetY={[-10, 10]}
        onGestureEvent={nativePanEvent}
        onHandlerStateChange={handleNativePanStateChange}
        testID="native-horizontal-page-pan"
      >
        {viewport}
      </PanGestureHandler>
    );
  }

  return (
    <GestureDetector gesture={pageGesture}>
      {viewport}
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  viewport: { flex: 1, minHeight: 0, overflow: 'hidden' },
  track: { flex: 1, flexDirection: 'row', minHeight: 0 },
  panel: { minHeight: 0 },
});
