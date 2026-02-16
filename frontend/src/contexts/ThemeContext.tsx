import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

type ThemeContextValue = {
  isLightMode: boolean;
  toggleTheme: () => void;
};

type ThemeProviderProps = {
  children: React.ReactNode;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const readStoredThemePreference = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  const storedPreference = window.localStorage.getItem('isLightMode');
  if (storedPreference === null) {
    return false;
  }

  try {
    const parsed = JSON.parse(storedPreference);
    return typeof parsed === 'boolean' ? parsed : false;
  } catch {
    return storedPreference === 'true';
  }
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
      window.localStorage.setItem('isLightMode', JSON.stringify(newMode));
      return newMode;
    });
  }, []);

  useEffect(() => {
    const lightModeStylesheet = document.getElementById('light-mode-stylesheet');
    if (isLightMode) {
      if (!lightModeStylesheet) {
        const link = document.createElement('link');
        link.id = 'light-mode-stylesheet';
        link.rel = 'stylesheet';
        link.href = '/Light-Mode.css';
        document.head.appendChild(link);
      }
      return;
    }

    lightModeStylesheet?.remove();
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
