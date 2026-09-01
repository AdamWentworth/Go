import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import {
  Image,
  StyleSheet,
  View,
} from 'react-native';
import { markNativeUiPerformance } from '../observability/nativeUiPerformanceTrace';

const FRAME_COUNT = 72;
const FRAME_DURATION_MS = 1000 / 60;
const FRAME_SIZE = 50;

const DARK_SPINNER_SOURCE = require('../../assets/loading-spinner-dark.gif');
const LIGHT_SPINNER_SOURCE = require('../../assets/loading-spinner-light.gif');

export const NATIVE_LOADING_SPINNER_SOURCES = [
  DARK_SPINNER_SOURCE,
  LIGHT_SPINNER_SOURCE,
] as const;

export const NATIVE_LOADING_SPINNER_DURATION_MS = FRAME_COUNT * FRAME_DURATION_MS;

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
  const [running, setRunning] = useState(autoStart);

  const stop = useCallback(() => {
    setRunning(false);
  }, []);

  const start = useCallback(() => {
    setRunning(true);
    markNativeUiPerformance('loading_spinner_driver_started');
  }, []);

  useImperativeHandle(ref, () => ({ start, stop }), [start, stop]);

  useEffect(() => {
    if (autoStart) start();
    else stop();
  }, [autoStart, start, stop]);

  return (
    <View pointerEvents="none" style={styles.viewport}>
      {running ? (
        <Image
          accessibilityElementsHidden
          fadeDuration={0}
          importantForAccessibility="no-hide-descendants"
          resizeMode="stretch"
          source={light ? LIGHT_SPINNER_SOURCE : DARK_SPINNER_SOURCE}
          style={styles.frame}
          testID={light ? 'native-loading-spinner-light' : 'native-loading-spinner-dark'}
        />
      ) : null}
    </View>
  );
});

NativeLoadingSpinner.displayName = 'NativeLoadingSpinner';

const styles = StyleSheet.create({
  frame: { height: FRAME_SIZE, width: FRAME_SIZE },
  viewport: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    overflow: 'hidden',
  },
});
