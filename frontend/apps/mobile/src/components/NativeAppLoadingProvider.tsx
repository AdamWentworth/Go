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

type NativeAppLoadingContextValue = {
  runWithLoading: (source: string, action: LoadingAction) => void;
  setLoadingSource: (source: string, active: boolean) => void;
};

const HIDE_DELAY_MS = 150;

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

  const runWithLoading = useCallback((source: string, action: LoadingAction) => {
    setLoadingSource(source, true);

    // Commit the overlay before changing routes. Release it one frame after
    // navigation so the destination replaces the previous screen underneath,
    // then retain the canonical 150 ms hide grace period.
    requestAnimationFrame(() => {
      try {
        action();
      } finally {
        requestAnimationFrame(() => setLoadingSource(source, false));
      }
    });
  }, [setLoadingSource]);

  const value = useMemo(
    () => ({ runWithLoading, setLoadingSource }),
    [runWithLoading, setLoadingSource],
  );

  return (
    <NativeAppLoadingContext.Provider value={value}>
      <View style={[styles.root, light && styles.rootLight]}>
        {children}
        {isVisible ? (
          <View
            accessibilityLabel="Loading"
            accessibilityLiveRegion="polite"
            accessibilityRole="progressbar"
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
        ) : null}
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
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 100000,
    elevation: 100000,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#101a19',
  },
  overlayLight: { backgroundColor: '#f8fff9' },
  spinner: { width: 50, height: 50 },
});
