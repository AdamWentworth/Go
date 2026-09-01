import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';
import { useNativeColorScheme } from '../features/settings/useNativeColorScheme';
import { runtimeConfig } from '../config/runtimeConfig';
import {
  NativeLoadingSpinner,
  NATIVE_LOADING_SPINNER_SOURCES,
} from './NativeLoadingSpinner';
import { markNativeUiPerformance } from '../observability/nativeUiPerformanceTrace';
import { loadingExperienceParityContract } from '@pokemongonexus/shared-ui-tokens';

type LoadingAction = () => void;

type NativeAppLoadingContextValue = {
  handleOverlayLayout: () => void;
  isVisible: boolean;
  light: boolean;
  runWithLoading: (source: string, action: LoadingAction) => void;
  setLoadingSource: (source: string, active: boolean) => void;
};

const HIDE_DELAY_MS = loadingExperienceParityContract.hideDelayMs;
// Deterministic device screenshots may hold the loader, but real navigation
// must follow Vite and release as soon as the destination has painted.
const POST_NAVIGATION_PAINT_HOLD_MS = runtimeConfig.mobile.deviceSmokeMode ? 8000 : 0;
const PATH_CHANGE_FALLBACK_MS = 3000;

const NativeAppLoadingContext = createContext<NativeAppLoadingContextValue>({
  handleOverlayLayout: () => undefined,
  isVisible: false,
  light: false,
  runWithLoading: (_source, action) => action(),
  setLoadingSource: () => undefined,
});

export const NativeAppLoadingProvider = ({
  children,
  navigationPath = null,
}: {
  children: ReactNode;
  navigationPath?: string | null;
}) => {
  const scheme = useNativeColorScheme();
  const light = scheme === 'light';
  const [activeSources, setActiveSources] = useState<Set<string>>(() => new Set());
  const [isVisible, setIsVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigationReleasesRef = useRef<Map<string, string | null>>(new Map());
  const fallbackTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    // react-native-web's Image implementation does not expose the native asset
    // resolver. Browser bundling already emits these required assets as URLs.
    if (Platform.OS === 'web' || typeof Image.resolveAssetSource !== 'function') return;
    for (const source of NATIVE_LOADING_SPINNER_SOURCES) {
      const uri = Image.resolveAssetSource(source)?.uri;
      if (uri) void Promise.resolve(Image.prefetch(uri)).catch(() => undefined);
    }
  }, []);

  const setLoadingSource = useCallback((source: string, active: boolean) => {
    if (active) setIsVisible(true);
    setActiveSources((previous) => {
      if (previous.has(source) === active) return previous;
      const next = new Set(previous);
      if (active) next.add(source);
      else next.delete(source);
      return next;
    });
  }, []);

  useEffect(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    if (activeSources.size > 0) {
      return undefined;
    }

    hideTimerRef.current = setTimeout(() => {
      setIsVisible(false);
      markNativeUiPerformance('loading_overlay_hidden');
      hideTimerRef.current = null;
    }, HIDE_DELAY_MS);

    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
  }, [activeSources]);

  const releaseAfterDestinationPaint = useCallback((source: string) => {
    if (!navigationReleasesRef.current.has(source)) return;
    navigationReleasesRef.current.delete(source);
    const fallback = fallbackTimersRef.current.get(source);
    if (fallback) clearTimeout(fallback);
    fallbackTimersRef.current.delete(source);
    requestAnimationFrame(() => {
      markNativeUiPerformance('loading_source_released', { source });
      setTimeout(
        () => setLoadingSource(source, false),
        POST_NAVIGATION_PAINT_HOLD_MS,
      );
    });
  }, [setLoadingSource]);

  useEffect(() => {
    for (const [source, startPath] of navigationReleasesRef.current) {
      if (startPath !== null && navigationPath !== null && navigationPath !== startPath) {
        markNativeUiPerformance('destination_path_committed', {
          destinationPath: navigationPath,
          source,
          startPath,
        });
        releaseAfterDestinationPaint(source);
      }
    }
  }, [navigationPath, releaseAfterDestinationPaint]);

  useEffect(() => () => {
    for (const timer of fallbackTimersRef.current.values()) clearTimeout(timer);
    fallbackTimersRef.current.clear();
  }, []);

  const runWithLoading = useCallback((source: string, action: LoadingAction) => {
    markNativeUiPerformance('loading_overlay_requested', { source });
    const startPath = navigationPath;
    setLoadingSource(source, true);
    navigationReleasesRef.current.set(source, startPath);
    markNativeUiPerformance('navigation_action_started', { source, startPath });
    try {
      action();
    } finally {
      // Match Vite by starting navigation in the interaction that enables the
      // loader. Path commit remains the authoritative release signal; this
      // fallback covers a no-op destination or navigation failure.
      const priorFallback = fallbackTimersRef.current.get(source);
      if (priorFallback) clearTimeout(priorFallback);
      fallbackTimersRef.current.set(source, setTimeout(
        () => releaseAfterDestinationPaint(source),
        PATH_CHANGE_FALLBACK_MS,
      ));
    }
  }, [navigationPath, releaseAfterDestinationPaint, setLoadingSource]);

  const handleOverlayLayout = useCallback(() => {
    markNativeUiPerformance('loading_overlay_laid_out');
  }, []);

  const value = useMemo(
    () => ({
      handleOverlayLayout,
      isVisible,
      light,
      runWithLoading,
      setLoadingSource,
    }),
    [handleOverlayLayout, isVisible, light, runWithLoading, setLoadingSource],
  );

  return (
    <NativeAppLoadingContext.Provider value={value}>
      {children}
    </NativeAppLoadingContext.Provider>
  );
};

// RootLayout renders this after the Stack inside the edge-to-edge window root.
// Keeping it in that tree avoids Android's separate dialog-window startup,
// which can otherwise finish after a fast destination has already committed.
export const NativeAppLoadingOverlay = () => {
  const { handleOverlayLayout, isVisible, light } = useContext(NativeAppLoadingContext);
  if (!isVisible) return null;
  return (
    <View
      onLayout={handleOverlayLayout}
      pointerEvents="auto"
      style={styles.overlayHost}
      testID="native-app-loading-host"
    >
      <View
        accessible
        accessibilityLabel="Loading"
        accessibilityLiveRegion="polite"
        accessibilityRole="progressbar"
        accessibilityViewIsModal
        importantForAccessibility="yes"
        style={[styles.overlay, light && styles.overlayLight]}
        testID="native-app-loading-overlay"
      >
        <NativeLoadingSpinner light={light} />
      </View>
    </View>
  );
};

export const useNativeAppLoading = (): NativeAppLoadingContextValue => (
  useContext(NativeAppLoadingContext)
);

const styles = StyleSheet.create({
  overlayHost: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 10000,
    elevation: 10000,
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#101a19',
  },
  overlayLight: { backgroundColor: '#f8fff9' },
});
