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

type FrontendPokemonWebScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'PokemonWebReplica'
>;

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

const buildPokemonPageUrl = (
  appBaseUrl: string,
  username: string,
  useOwnRoute: boolean,
): string => {
  const base = trimTrailingSlash(appBaseUrl);
  if (useOwnRoute) return `${base}/pokemon`;
  const normalizedUser = username.trim();
  if (!normalizedUser) return `${base}/pokemon`;
  return `${base}/pokemon/${encodeURIComponent(normalizedUser)}`;
};

export const FrontendPokemonWebScreen = ({
  navigation,
  route,
}: FrontendPokemonWebScreenProps) => {
  const { user } = useAuth();
  const [usernameDraft, setUsernameDraft] = useState(
    route.params?.username ?? user?.username ?? '',
  );
  const [useOwnRoute, setUseOwnRoute] = useState(Boolean(route.params?.ownRoute));
  const [version, setVersion] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUrl, setCurrentUrl] = useState('');
  const webViewRef = useRef<WebView>(null);

  const pageUrl = useMemo(
    () =>
      buildPokemonPageUrl(
        runtimeConfig.api.frontendAppUrl,
        usernameDraft,
        useOwnRoute,
      ),
    [useOwnRoute, usernameDraft],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pokemon Page Replica</Text>
        <Text style={styles.caption}>
          Rendering the same web Pokemon UI for visual parity checks.
        </Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          value={usernameDraft}
          onChangeText={setUsernameDraft}
          placeholder="username (for /pokemon/:username)"
          style={styles.input}
        />
        <View style={styles.actions}>
          <Button
            title={useOwnRoute ? 'Using /pokemon' : 'Use /pokemon'}
            onPress={() => setUseOwnRoute(true)}
          />
          <Button
            title={!useOwnRoute ? 'Using /pokemon/:username' : 'Use /pokemon/:username'}
            onPress={() => setUseOwnRoute(false)}
          />
        </View>
        <View style={styles.actions}>
          <Button title="Back" onPress={() => navigation.goBack()} />
          <Button title="Reload" onPress={() => webViewRef.current?.reload()} />
          <Button title="Apply URL" onPress={() => setVersion((prev) => prev + 1)} />
        </View>
        <Text style={styles.urlText} numberOfLines={2}>
          {currentUrl || pageUrl}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator />
        </View>
      ) : null}

      <WebView
        key={`pokemon-web-replica-${version}`}
        ref={webViewRef}
        source={{ uri: pageUrl }}
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

