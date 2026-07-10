import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import {
  useLocation,
  useNavigate,
  useNavigationType,
  type Location,
} from 'react-router-dom';

type ContextBackHandler = () => boolean | void;

type ContextBackEntry = {
  id: symbol;
  handler: ContextBackHandler;
};

type ContextBackContextValue = {
  registerBackHandler: (handler: ContextBackHandler, label?: string) => () => void;
};

const ContextBackContext = createContext<ContextBackContextValue | undefined>(undefined);

function getLocationUrl(location: Location) {
  return `${location.pathname}${location.search}${location.hash}`;
}

function getGuardState() {
  return {
    __pgnContextBackGuard: true,
  };
}

export function ContextBackProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const currentUrlRef = useRef(getLocationUrl(location));
  const initializedRef = useRef(false);
  const guardedUrlRef = useRef<string | null>(null);
  const entriesRef = useRef<ContextBackEntry[]>([]);

  const pushGuardEntry = useCallback((url: string) => {
    window.history.pushState(getGuardState(), '', url);
    currentUrlRef.current = url;
    guardedUrlRef.current = url;
  }, []);

  useLayoutEffect(() => {
    const locationUrl = getLocationUrl(location);

    if (!initializedRef.current) {
      initializedRef.current = true;
      pushGuardEntry(locationUrl);
      return;
    }

    if (navigationType !== 'POP') {
      currentUrlRef.current = locationUrl;
      if (guardedUrlRef.current !== locationUrl) {
        pushGuardEntry(locationUrl);
      }
    }
  }, [location, navigationType, pushGuardEntry]);

  const registerBackHandler = useCallback((handler: ContextBackHandler, label?: string) => {
    const entry: ContextBackEntry = {
      id: Symbol(label ?? 'context-back-handler'),
      handler,
    };

    entriesRef.current = [...entriesRef.current, entry];

    return () => {
      entriesRef.current = entriesRef.current.filter((candidate) => candidate.id !== entry.id);
    };
  }, []);

  const handleContextBack = useCallback(() => {
    const entries = entriesRef.current;

    for (let index = entries.length - 1; index >= 0; index -= 1) {
      const handled = entries[index].handler();
      if (handled !== false) {
        return true;
      }
    }

    return false;
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const currentUrl = currentUrlRef.current;
      pushGuardEntry(currentUrl);
      handleContextBack();
      window.setTimeout(() => {
        navigate(currentUrl, { replace: true });
      }, 0);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [handleContextBack, navigate, pushGuardEntry]);

  const value = useMemo<ContextBackContextValue>(
    () => ({
      registerBackHandler,
    }),
    [registerBackHandler],
  );

  return (
    <ContextBackContext.Provider value={value}>
      {children}
    </ContextBackContext.Provider>
  );
}

export function useContextBackHandler(
  enabled: boolean,
  onBack: ContextBackHandler,
  label?: string,
) {
  const context = useContext(ContextBackContext);
  const onBackRef = useRef(onBack);

  useEffect(() => {
    onBackRef.current = onBack;
  }, [onBack]);

  useEffect(() => {
    if (!context) return undefined;
    if (!enabled) return undefined;

    return context.registerBackHandler(() => onBackRef.current(), label);
  }, [context, enabled, label]);
}
