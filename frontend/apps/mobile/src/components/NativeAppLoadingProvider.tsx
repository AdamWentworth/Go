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
import { Image, StyleSheet, View } from 'react-native';
import { useNativeColorScheme } from '../features/settings/useNativeColorScheme';

type LoadingAction = () => void;
type PendingLoadingAction = {
  action: LoadingAction;
  source: string;
  startPath: string | null;
};

type NativeAppLoadingContextValue = {
  handleOverlayLayout: () => void;
  isVisible: boolean;
  light: boolean;
  runWithLoading: (source: string, action: LoadingAction) => void;
  setLoadingSource: (source: string, active: boolean) => void;
};

const HIDE_DELAY_MS = 150;
// Android may not decode the first frame of a bundled animated GIF before a
// route transition finishes. Keep action-menu navigation covered after the
// route mount starts so the canonical spinner is perceptible on fast and slow
// devices instead of expiring mid-transition.
const POST_NAVIGATION_PAINT_HOLD_MS = 1200;
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
  const overlayReadyRef = useRef(false);
  const pendingActionsRef = useRef<PendingLoadingAction[]>([]);
  const navigationReleasesRef = useRef<Map<string, string | null>>(new Map());
  const fallbackTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

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
      hideTimerRef.current = null;
    }, HIDE_DELAY_MS);

    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
  }, [activeSources]);

  useEffect(() => {
    if (!isVisible) overlayReadyRef.current = false;
  }, [isVisible]);

  const releaseAfterDestinationPaint = useCallback((source: string) => {
    if (!navigationReleasesRef.current.has(source)) return;
    navigationReleasesRef.current.delete(source);
    const fallback = fallbackTimersRef.current.get(source);
    if (fallback) clearTimeout(fallback);
    fallbackTimersRef.current.delete(source);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setTimeout(
        () => setLoadingSource(source, false),
        POST_NAVIGATION_PAINT_HOLD_MS,
      );
    }));
  }, [setLoadingSource]);

  useEffect(() => {
    for (const [source, startPath] of navigationReleasesRef.current) {
      if (startPath !== null && navigationPath !== null && navigationPath !== startPath) {
        releaseAfterDestinationPaint(source);
      }
    }
  }, [navigationPath, releaseAfterDestinationPaint]);

  useEffect(() => () => {
    for (const timer of fallbackTimersRef.current.values()) clearTimeout(timer);
    fallbackTimersRef.current.clear();
  }, []);

  const flushPendingActions = useCallback(() => {
    if (!overlayReadyRef.current || pendingActionsRef.current.length === 0) return;
    const pending = pendingActionsRef.current.splice(0);

    // onLayout confirms the Activity-owned overlay is mounted. Wait two
    // display frames so its opaque surface and first spinner frame are
    // composited before a large destination mount can occupy the JS/UI threads.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      for (const { action, source, startPath } of pending) {
        navigationReleasesRef.current.set(source, startPath);
        try {
          action();
        } finally {
          // A path change is the authoritative signal that the destination
          // committed. The fallback also waits for paint, covering a no-op
          // destination or navigation failure without leaving the overlay up.
          const priorFallback = fallbackTimersRef.current.get(source);
          if (priorFallback) clearTimeout(priorFallback);
          fallbackTimersRef.current.set(source, setTimeout(
            () => releaseAfterDestinationPaint(source),
            PATH_CHANGE_FALLBACK_MS,
          ));
        }
      }
    }));
  }, [releaseAfterDestinationPaint]);

  const runWithLoading = useCallback((source: string, action: LoadingAction) => {
    pendingActionsRef.current.push({ action, source, startPath: navigationPath });
    setLoadingSource(source, true);
    flushPendingActions();
  }, [flushPendingActions, navigationPath, setLoadingSource]);

  const handleOverlayLayout = useCallback(() => {
    overlayReadyRef.current = true;
    flushPendingActions();
  }, [flushPendingActions]);

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

// Native-stack screens can be composited above ordinary provider siblings on
// Android. Mount the loader inside every active screen layout so it remains
// above that screen's header and content while still occupying the Activity's
// full edge-to-edge bounds.
export const NativeAppLoadingOverlay = () => {
  const { handleOverlayLayout, isVisible, light } = useContext(NativeAppLoadingContext);
  if (!isVisible) return null;
  return (
    <View
      accessible
      accessibilityLabel="Loading"
      accessibilityLiveRegion="polite"
      accessibilityRole="progressbar"
      accessibilityViewIsModal
      importantForAccessibility="yes"
      onLayout={handleOverlayLayout}
      style={[StyleSheet.absoluteFill, styles.overlay, light && styles.overlayLight]}
      testID="native-app-loading-overlay"
    >
      <Image
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        resizeMode="contain"
        source={light
          ? require('../../assets/loading-spinner-light.gif')
          : require('../../assets/loading-spinner-dark.gif')}
        style={styles.spinner}
        testID={light ? 'native-loading-spinner-light' : 'native-loading-spinner-dark'}
      />
    </View>
  );
};

export const useNativeAppLoading = (): NativeAppLoadingContextValue => (
  useContext(NativeAppLoadingContext)
);

const styles = StyleSheet.create({
  overlay: {
    zIndex: 100000,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#101a19',
    elevation: 100000,
  },
  overlayLight: { backgroundColor: '#f8fff9' },
  spinner: { width: 50, height: 50 },
});
