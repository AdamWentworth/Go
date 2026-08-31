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

type LoadingAction = () => void;
type PendingLoadingAction = { action: LoadingAction; source: string };

type NativeAppLoadingContextValue = {
  runWithLoading: (source: string, action: LoadingAction) => void;
  setLoadingSource: (source: string, active: boolean) => void;
};

const HIDE_DELAY_MS = 150;
// Android may not decode the first frame of a bundled animated GIF before a
// route transition finishes. Keep action-menu navigation covered after the
// route mount starts so the canonical spinner is perceptible on fast and slow
// devices instead of expiring mid-transition.
const NAVIGATION_RELEASE_DELAY_MS = 1800;

const NativeAppLoadingContext = createContext<NativeAppLoadingContextValue>({
  runWithLoading: (_source, action) => action(),
  setLoadingSource: () => undefined,
});

export const NativeAppLoadingProvider = ({ children }: { children: ReactNode }) => {
  const scheme = useNativeColorScheme();
  const light = scheme === 'light';
  const [activeSources, setActiveSources] = useState<Set<string>>(() => new Set());
  const [isVisible, setIsVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modalShownRef = useRef(false);
  const pendingActionsRef = useRef<PendingLoadingAction[]>([]);

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

  const flushPendingActions = useCallback(() => {
    if (!modalShownRef.current || pendingActionsRef.current.length === 0) return;
    const pending = pendingActionsRef.current.splice(0);

    // Dialog.onShow means Android created the modal window. Wait two display
    // frames as well so the opaque surface and first spinner frame are
    // actually composited before a large destination mount can occupy the JS
    // and UI threads.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      for (const { action, source } of pending) {
        try {
          action();
        } finally {
          setTimeout(() => setLoadingSource(source, false), NAVIGATION_RELEASE_DELAY_MS);
        }
      }
    }));
  }, [setLoadingSource]);

  const runWithLoading = useCallback((source: string, action: LoadingAction) => {
    pendingActionsRef.current.push({ action, source });
    setLoadingSource(source, true);
    flushPendingActions();
  }, [flushPendingActions, setLoadingSource]);

  const handleModalShow = useCallback(() => {
    modalShownRef.current = true;
    flushPendingActions();
  }, [flushPendingActions]);

  const value = useMemo(
    () => ({ runWithLoading, setLoadingSource }),
    [runWithLoading, setLoadingSource],
  );

  return (
    <NativeAppLoadingContext.Provider value={value}>
      <View style={[styles.root, light && styles.rootLight]}>
        {children}
        {isVisible ? <Modal
          animationType="none"
          hardwareAccelerated
          navigationBarTranslucent
          onDismiss={() => { modalShownRef.current = false; }}
          onRequestClose={() => undefined}
          onShow={handleModalShow}
          presentationStyle="overFullScreen"
          statusBarTranslucent
          transparent={false}
          visible
        >
          <View
            accessible
            accessibilityLabel="Loading"
            accessibilityLiveRegion="polite"
            accessibilityRole="progressbar"
            accessibilityViewIsModal
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
        </Modal> : null}
      </View>
    </NativeAppLoadingContext.Provider>
  );
};

export const useNativeAppLoading = (): NativeAppLoadingContextValue => (
  useContext(NativeAppLoadingContext)
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#101a19' },
  rootLight: { backgroundColor: '#f8fff9' },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#101a19',
  },
  overlayLight: { backgroundColor: '#f8fff9' },
  spinner: { width: 50, height: 50 },
});
