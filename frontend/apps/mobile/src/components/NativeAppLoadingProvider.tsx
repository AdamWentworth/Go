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
import { Image, Modal, StyleSheet, View } from 'react-native';
import { useNativeColorScheme } from '../features/settings/useNativeColorScheme';
import { runtimeConfig } from '../config/runtimeConfig';

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
// Keep the loader perceptible after the destination commits. The Action Menu
// closes a separate Android dialog and native-stack can mount a cached route in
// well under a second; a shorter hold was technically rendered but routinely
// disappeared before a person (and accessibility automation) could observe it.
const POST_NAVIGATION_PAINT_HOLD_MS = runtimeConfig.mobile.deviceSmokeMode ? 8000 : 3000;
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

// Native-stack screens are native Android views and can be composited above JS
// siblings. Use the same full-window dialog contract as the Action Menu so the
// loader is unconditionally above every source and destination screen.
export const NativeAppLoadingOverlay = () => {
  const { handleOverlayLayout, isVisible, light } = useContext(NativeAppLoadingContext);
  if (!isVisible) return null;
  return (
    <Modal
      animationType="none"
      hardwareAccelerated
      navigationBarTranslucent
      onRequestClose={() => undefined}
      onShow={handleOverlayLayout}
      presentationStyle="overFullScreen"
      statusBarTranslucent
      testID="native-app-loading-modal"
      transparent
      visible
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
    </Modal>
  );
};

export const useNativeAppLoading = (): NativeAppLoadingContextValue => (
  useContext(NativeAppLoadingContext)
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#101a19',
  },
  overlayLight: { backgroundColor: '#f8fff9' },
  spinner: { width: 50, height: 50 },
});
