import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  getStorageBoolean,
  setStorageBoolean,
  STORAGE_KEYS,
} from '@/utils/storage';
import { applyThemePreferenceToDocument } from '@/utils/theme';

type ThemeContextValue = {
  isLightMode: boolean;
  toggleTheme: () => void;
};

type ThemeProviderProps = {
  children: React.ReactNode;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const readStoredThemePreference = (): boolean => {
  return getStorageBoolean(STORAGE_KEYS.isLightMode, false);
};

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isLightMode, setIsLightMode] = useState<boolean>(() =>
    readStoredThemePreference(),
  );

  const toggleTheme = useCallback(() => {
    setIsLightMode((prevMode) => {
      const newMode = !prevMode;
      setStorageBoolean(STORAGE_KEYS.isLightMode, newMode);
      return newMode;
    });
  }, []);

  useEffect(() => {
    applyThemePreferenceToDocument(isLightMode);
  }, [isLightMode]);

  const value = useMemo(
    () => ({
      isLightMode,
      toggleTheme,
    }),
    [isLightMode, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
