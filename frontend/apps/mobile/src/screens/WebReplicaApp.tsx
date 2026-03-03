import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { runtimeConfig } from '../config/runtimeConfig';

const DEFAULT_PATH = '/pokemon';
const LOAD_TIMEOUT_MS = 15000;

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');
const ensureLeadingSlash = (value: string): string =>
  value.startsWith('/') ? value : `/${value}`;

const resolveUrl = (baseUrl: string, path: string): string =>
  `${trimTrailingSlash(baseUrl)}${ensureLeadingSlash(path.trim() || '/')}`;

export const WebReplicaApp = () => {
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasCompletedInitialLoadRef = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const targetUrl = useMemo(
    () => resolveUrl(runtimeConfig.api.frontendAppUrl, DEFAULT_PATH),
    [],
  );

  const clearLoadTimeout = () => {
    if (!loadTimeoutRef.current) return;
    clearTimeout(loadTimeoutRef.current);
    loadTimeoutRef.current = null;
  };

  const startLoading = () => {
    if (hasCompletedInitialLoadRef.current) return;
    clearLoadTimeout();
    setIsLoading(true);
    loadTimeoutRef.current = setTimeout(() => {
      hasCompletedInitialLoadRef.current = true;
      setIsLoading(false);
      loadTimeoutRef.current = null;
    }, LOAD_TIMEOUT_MS);
  };

  const stopLoading = () => {
    hasCompletedInitialLoadRef.current = true;
    clearLoadTimeout();
    setIsLoading(false);
  };

  useEffect(
    () => () => {
      clearLoadTimeout();
    },
    [],
  );

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View testID="web-replica-loading" style={styles.loadingOverlay}>
          <ActivityIndicator />
        </View>
      ) : null}
      <WebView
        testID="web-replica-webview"
        source={{ uri: targetUrl }}
        style={styles.webview}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        onLoadStart={startLoading}
        onLoadEnd={stopLoading}
        onError={stopLoading}
        onHttpError={stopLoading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
});
