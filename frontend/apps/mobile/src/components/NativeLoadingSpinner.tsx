import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  View,
} from 'react-native';
import { markNativeUiPerformance } from '../observability/nativeUiPerformanceTrace';

const FRAME_COUNT = 72;
const FRAME_COLUMNS = 36;
const FRAME_ROWS = 2;
const FRAME_DURATION_MS = 1000 / 60;
const FRAME_SIZE = 50;
const STEP_EPSILON = 0.00001;

const DARK_SPINNER_SOURCE = require('../../assets/loading-spinner-dark-strip.png');
const LIGHT_SPINNER_SOURCE = require('../../assets/loading-spinner-light-strip.png');

export const NATIVE_LOADING_SPINNER_SOURCES = [
  DARK_SPINNER_SOURCE,
  LIGHT_SPINNER_SOURCE,
] as const;

export const NATIVE_LOADING_SPINNER_DURATION_MS = FRAME_COUNT * FRAME_DURATION_MS;
const NATIVE_LOADING_SPINNER_EPOCH_MS = Date.now();

const buildSteppedValue = (valueForFrame: (frame: number) => number) => {
  const inputRange = [0];
  const outputRange = [valueForFrame(0)];

  for (let frame = 1; frame < FRAME_COUNT; frame += 1) {
    const boundary = frame / FRAME_COUNT;
    inputRange.push(boundary - STEP_EPSILON, boundary);
    outputRange.push(valueForFrame(frame - 1), valueForFrame(frame));
  }

  inputRange.push(1);
  outputRange.push(valueForFrame(FRAME_COUNT - 1));
  return { inputRange, outputRange };
};

const STEPPED_TRANSLATE_X = buildSteppedValue(
  (frame) => -(frame % FRAME_COLUMNS) * FRAME_SIZE,
);
const STEPPED_TRANSLATE_Y = buildSteppedValue(
  (frame) => -Math.floor(frame / FRAME_COLUMNS) * FRAME_SIZE,
);

export const resolveNativeLoadingSpinnerPhase = (elapsedMs: number): number => {
  const normalized = (
    (elapsedMs % NATIVE_LOADING_SPINNER_DURATION_MS)
    + NATIVE_LOADING_SPINNER_DURATION_MS
  ) % NATIVE_LOADING_SPINNER_DURATION_MS;
  return normalized / NATIVE_LOADING_SPINNER_DURATION_MS;
};

export type NativeLoadingSpinnerHandle = {
  start: () => void;
  stop: () => void;
};

type Props = {
  autoStart?: boolean;
  light: boolean;
};

export const NativeLoadingSpinner = forwardRef<NativeLoadingSpinnerHandle, Props>(({
  autoStart = true,
  light,
}, ref) => {
  const [progress] = useState(() => new Animated.Value(0));
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  const stop = useCallback(() => {
    animationRef.current?.stop();
    animationRef.current = null;
  }, []);

  const start = useCallback(() => {
    stop();
    const phase = resolveNativeLoadingSpinnerPhase(
      Date.now() - NATIVE_LOADING_SPINNER_EPOCH_MS,
    );
    progress.setValue(phase);
    const finishCurrentLoop = Animated.timing(progress, {
      duration: Math.max(1, (1 - phase) * NATIVE_LOADING_SPINNER_DURATION_MS),
      easing: Easing.linear,
      isInteraction: false,
      toValue: 1,
      useNativeDriver: true,
    });
    const resetLoop = Animated.timing(progress, {
      duration: 0,
      easing: Easing.linear,
      isInteraction: false,
      toValue: 0,
      useNativeDriver: true,
    });
    const continuousLoop = Animated.loop(
      Animated.timing(progress, {
        duration: NATIVE_LOADING_SPINNER_DURATION_MS,
        easing: Easing.linear,
        isInteraction: false,
        toValue: 1,
        useNativeDriver: true,
      }),
      { resetBeforeIteration: true },
    );
    const animation = Animated.sequence([finishCurrentLoop, resetLoop, continuousLoop]);
    animationRef.current = animation;
    animation.start();
    markNativeUiPerformance('loading_spinner_driver_started');
  }, [progress, stop]);

  useImperativeHandle(ref, () => ({ start, stop }), [start, stop]);

  useEffect(() => {
    if (autoStart) start();
    return stop;
  }, [autoStart, start, stop]);

  return (
    <View pointerEvents="none" style={styles.viewport}>
      <Animated.View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        renderToHardwareTextureAndroid
        style={[
          styles.strip,
          {
            transform: [{
              translateX: progress.interpolate(STEPPED_TRANSLATE_X),
            }, {
              translateY: progress.interpolate(STEPPED_TRANSLATE_Y),
            }],
          },
        ]}
        testID={light ? 'native-loading-spinner-light' : 'native-loading-spinner-dark'}
      >
        <Image
          fadeDuration={0}
          resizeMode="stretch"
          source={light ? LIGHT_SPINNER_SOURCE : DARK_SPINNER_SOURCE}
          style={styles.strip}
        />
      </Animated.View>
    </View>
  );
});

NativeLoadingSpinner.displayName = 'NativeLoadingSpinner';

const styles = StyleSheet.create({
  strip: {
    height: FRAME_SIZE * FRAME_ROWS,
    width: FRAME_SIZE * FRAME_COLUMNS,
  },
  viewport: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    overflow: 'hidden',
  },
});
