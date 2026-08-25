import {
  AccessibilityInfo,
  Appearance,
} from 'react-native';
import {
  type PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { logWarn } from '../../observability/logger';
import {
  defaultNativeDevicePreferences,
  readNativeDevicePreferences,
  type NativeColorTheme,
  type NativeDevicePreferences,
  writeNativeDevicePreferences,
} from './nativeDevicePreferences';

type NativeDevicePreferencesContextValue = NativeDevicePreferences & {
  hydrated: boolean;
  shouldReduceMotion: boolean;
  setColorTheme: (theme: NativeColorTheme) => void;
  setReduceMotion: (enabled: boolean) => void;
  toggleColorTheme: () => void;
};

const normalizeTheme = (scheme: string | null | undefined): NativeColorTheme =>
  scheme === 'light' ? 'light' : 'dark';

const NativeDevicePreferencesContext = createContext<NativeDevicePreferencesContextValue | null>(null);

export const useNativeDevicePreferences = (): NativeDevicePreferencesContextValue => {
  const context = useContext(NativeDevicePreferencesContext);
  if (!context) throw new Error('Native device preferences require their provider.');
  return context;
};

export const useOptionalNativeDevicePreferences = (): NativeDevicePreferencesContextValue | null =>
  useContext(NativeDevicePreferencesContext);

export const NativeDevicePreferencesProvider = ({ children }: PropsWithChildren) => {
  const [preferences, setPreferences] = useState<NativeDevicePreferences>(() =>
    defaultNativeDevicePreferences(normalizeTheme(Appearance.getColorScheme())),
  );
  const [hydrated, setHydrated] = useState(false);
  const [systemReduceMotion, setSystemReduceMotion] = useState(false);

  useEffect(() => {
    let active = true;
    void readNativeDevicePreferences(normalizeTheme(Appearance.getColorScheme()))
      .then((stored) => {
        if (!active) return;
        setPreferences(stored);
        Appearance.setColorScheme(stored.colorTheme);
      })
      .catch((error: unknown) => {
        logWarn('device-preferences', 'Unable to restore native device preferences', error);
      })
      .finally(() => {
        if (active) setHydrated(true);
      });
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) setSystemReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setSystemReduceMotion,
    );
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  const persist = useCallback((next: NativeDevicePreferences) => {
    setPreferences(next);
    void writeNativeDevicePreferences(next).catch((error: unknown) => {
      logWarn('device-preferences', 'Unable to persist native device preferences', error);
    });
  }, []);

  const setColorTheme = useCallback((colorTheme: NativeColorTheme) => {
    Appearance.setColorScheme(colorTheme);
    persist({ ...preferences, colorTheme });
  }, [persist, preferences]);

  const setReduceMotion = useCallback((reduceMotion: boolean) => {
    persist({ ...preferences, reduceMotion });
  }, [persist, preferences]);

  const toggleColorTheme = useCallback(() => {
    setColorTheme(preferences.colorTheme === 'light' ? 'dark' : 'light');
  }, [preferences.colorTheme, setColorTheme]);

  const value = useMemo<NativeDevicePreferencesContextValue>(() => ({
    ...preferences,
    hydrated,
    setColorTheme,
    setReduceMotion,
    shouldReduceMotion: preferences.reduceMotion || systemReduceMotion,
    toggleColorTheme,
  }), [hydrated, preferences, setColorTheme, setReduceMotion, systemReduceMotion, toggleColorTheme]);

  return (
    <NativeDevicePreferencesContext.Provider value={value}>
      {children}
    </NativeDevicePreferencesContext.Provider>
  );
};
