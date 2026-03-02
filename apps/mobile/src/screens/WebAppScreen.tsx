import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WebView } from 'react-native-webview';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { runtimeConfig } from '../config/runtimeConfig';
import { useAuth } from '../features/auth/AuthProvider';

type WebAppScreenProps = NativeStackScreenProps<RootStackParamList, 'WebApp'>;

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');
const ensureLeadingSlash = (value: string): string =>
  value.startsWith('/') ? value : `/${value}`;

const resolvePath = (pathTemplate: string, username: string): string => {
  const normalizedTemplate = ensureLeadingSlash(pathTemplate.trim() || '/');
  const normalizedUsername = username.trim();
  if (!normalizedTemplate.includes(':username')) return normalizedTemplate;
  if (!normalizedUsername) return normalizedTemplate.replace(':username', '');
  return normalizedTemplate.replace(':username', encodeURIComponent(normalizedUsername));
};

const buildAppUrl = (appBaseUrl: string, path: string): string =>
  `${trimTrailingSlash(appBaseUrl)}${ensureLeadingSlash(path)}`;

export const WebAppScreen = ({ navigation, route }: WebAppScreenProps) => {
  const { user } = useAuth();
  const [pathDraft, setPathDraft] = useState(route.params?.path ?? '/');
  const [usernameDraft, setUsernameDraft] = useState(
    route.params?.username ?? user?.username ?? '',
  );
  const [version, setVersion] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUrl, setCurrentUrl] = useState('');
  const webViewRef = useRef<WebView>(null);
  const title = route.params?.title ?? 'Web App';

  const resolvedPath = useMemo(
    () => resolvePath(pathDraft, usernameDraft),
    [pathDraft, usernameDraft],
  );
  const appUrl = useMemo(
    () => buildAppUrl(runtimeConfig.api.frontendAppUrl, resolvedPath),
    [resolvedPath],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.caption}>
          Shared web frontend rendered in mobile for parity and single-source UI.
        </Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="path (example: /pokemon/:username)"
          value={pathDraft}
          onChangeText={setPathDraft}
          style={styles.input}
        />
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="username (for :username path token)"
          value={usernameDraft}
          onChangeText={setUsernameDraft}
          style={styles.input}
        />
        <View style={styles.actions}>
          <Button title="Back" onPress={() => navigation.goBack()} />
          <Button title="Reload" onPress={() => webViewRef.current?.reload()} />
          <Button title="Apply URL" onPress={() => setVersion((prev) => prev + 1)} />
        </View>
        <Text style={styles.urlText} numberOfLines={2}>
          {currentUrl || appUrl}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator />
        </View>
      ) : null}

      <WebView
        key={`web-app-${version}`}
        ref={webViewRef}
        source={{ uri: appUrl }}
        style={styles.webview}
        startInLoadingState
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onNavigationStateChange={(state) => setCurrentUrl(state.url)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    backgroundColor: '#111',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  caption: {
    fontSize: 12,
    color: '#cfcfcf',
  },
  input: {
    borderWidth: 1,
    borderColor: '#3a3a3a',
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    color: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  urlText: {
    color: '#9db8ff',
    fontSize: 11,
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingOverlay: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 20,
  },
});

