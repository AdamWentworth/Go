import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { runtimeConfig } from '../../config/runtimeConfig';
import {
  getConnectivityState,
  requestWithPolicy,
  subscribeConnectivity,
  type ConnectivityState,
} from '../../services/httpClient';

type NetworkContextValue = ConnectivityState & {
  checking: boolean;
  refreshConnectivity: () => Promise<void>;
};

const defaultValue: NetworkContextValue = {
  ...getConnectivityState(),
  checking: false,
  refreshConnectivity: async () => {},
};

const NetworkContext = createContext<NetworkContextValue>(defaultValue);

const resolveProbeUrl = (): string => {
  const base = runtimeConfig.api.usersApiUrl;
  if (base.endsWith('/')) return base;
  return `${base}/`;
};

export const NetworkProvider = ({ children }: PropsWithChildren) => {
  const [connectivity, setConnectivity] = useState<ConnectivityState>(getConnectivityState);
  const [checking, setChecking] = useState(false);

  useEffect(() => subscribeConnectivity(setConnectivity), []);

  const refreshConnectivity = useCallback(async () => {
    setChecking(true);
    try {
      await requestWithPolicy(resolveProbeUrl(), {
        method: 'GET',
        retryCount: 0,
        timeoutMs: 4000,
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
    } catch {
      // requestWithPolicy updates connectivity state on failures.
    } finally {
      setChecking(false);
    }
  }, []);

  const value = useMemo<NetworkContextValue>(
    () => ({
      ...connectivity,
      checking,
      refreshConnectivity,
    }),
    [checking, connectivity, refreshConnectivity],
  );

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
};

export const useNetwork = (): NetworkContextValue => useContext(NetworkContext);
