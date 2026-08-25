import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeActionMenu } from '../../components/NativeActionMenu';
import { NativeActionMenuAnchor } from '../../components/NativeActionMenuAnchor';
import { runtimeConfig } from '../../config/runtimeConfig';
import { useNativeDevicePreferences } from '../../features/settings/NativeDevicePreferencesProvider';
import { resolveNativeActionMenuDestination } from '../../navigation/nativeActionMenuNavigation';

const firstParam = (value: string | string[] | undefined): string => (
  Array.isArray(value) ? value[0] ?? '' : value ?? ''
);

export default function NativeNotFoundRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ path?: string | string[] }>();
  const preferences = useNativeDevicePreferences();
  const light = preferences.colorTheme === 'light';
  const [menuOpen, setMenuOpen] = useState(false);
  const requestedPath = firstParam(params.path);
  const navigate = (path: string) => {
    setMenuOpen(false);
    const destination = resolveNativeActionMenuDestination(path);
    if (destination.kind === 'native') router.replace(destination.pathname);
    else if (destination.kind === 'web') {
      router.replace({ pathname: '/web', params: { path: destination.path } });
    }
  };

  return (
    <View style={[styles.root, light && styles.rootLight]} testID="native-not-found-screen">
      <View style={[styles.card, light && styles.cardLight]}>
        <Text style={styles.code}>404</Text>
        <Text accessibilityRole="header" style={[styles.title, light && styles.titleLight]}>
          This route got away
        </Text>
        <Text style={[styles.copy, light && styles.copyLight]}>
          The page may have moved, or the shared link may be incomplete.
        </Text>
        {requestedPath ? (
          <Text numberOfLines={2} style={[styles.path, light && styles.pathLight]}>{requestedPath}</Text>
        ) : null}
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.canGoBack() ? router.back() : router.replace('/native')}
            style={[styles.secondary, light && styles.secondaryLight]}
          >
            <Text style={[styles.secondaryText, light && styles.titleLight]}>Go back</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.replace('/native')} style={styles.primary}>
            <Text style={styles.primaryText}>Open home</Text>
          </Pressable>
        </View>
      </View>
      <NativeActionMenuAnchor
        assetBaseUrl={runtimeConfig.api.frontendAppUrl}
        onPress={() => setMenuOpen(true)}
      />
      {menuOpen ? (
        <NativeActionMenu
          assetBaseUrl={runtimeConfig.api.frontendAppUrl}
          onClose={() => setMenuOpen(false)}
          onNavigate={navigate}
          visible
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: '#06131d' },
  rootLight: { backgroundColor: '#edf4f7' },
  card: { width: '100%', maxWidth: 520, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#314b58', borderRadius: 22, padding: 28, backgroundColor: '#121e25' },
  cardLight: { borderColor: '#b8c7ce', backgroundColor: '#fff' },
  code: { color: '#269df4', fontSize: 58, lineHeight: 62, fontWeight: '900' },
  title: { color: '#f5fbfd', fontSize: 25, fontWeight: '900', textAlign: 'center' },
  titleLight: { color: '#102129' },
  copy: { maxWidth: 400, color: '#a8bac2', fontSize: 15, lineHeight: 22, textAlign: 'center' },
  copyLight: { color: '#536970' },
  path: { maxWidth: '100%', color: '#8ca4af', fontSize: 12, textAlign: 'center' },
  pathLight: { color: '#64777f' },
  actions: { width: '100%', flexDirection: 'row', gap: 10, marginTop: 8 },
  primary: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#168ff0' },
  primaryText: { color: '#fff', fontWeight: '900' },
  secondary: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#4b626c', borderRadius: 12, backgroundColor: '#19272e' },
  secondaryLight: { borderColor: '#a9bbc2', backgroundColor: '#f4f8f9' },
  secondaryText: { color: '#eef6f8', fontWeight: '800' },
});
