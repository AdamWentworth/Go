import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNativeSession } from '../../auth/NativeSessionContext';
import { NativeLoginScreen } from '../../screens/NativeLoginScreen';
import { theme } from '../../ui/theme';
import { resolveNativeLoginReturnTo } from '../../navigation/nativeActionMenuNavigation';

export default function NativeLoginRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ returnTo?: string | string[] }>();
  const { retrySession, signIn, status, user } = useNativeSession();
  const requestedReturnTo = Array.isArray(params.returnTo)
    ? params.returnTo[0]
    : params.returnTo;
  const returnTo = resolveNativeLoginReturnTo(requestedReturnTo);
  const returnHref = returnTo.startsWith('/native/profile/')
    ? {
        pathname: '/native/profile/[username]' as const,
        params: { username: decodeURIComponent(returnTo.slice('/native/profile/'.length)) },
      }
    : returnTo === '/native/collection'
      || returnTo === '/native/search'
      || returnTo === '/native/trades'
      || returnTo === '/native/profile'
      ? returnTo
      : '/web' as const;

  if (status === 'restoring') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#5ed8ff" size="large" />
        <Text style={styles.body}>Checking your secure session…</Text>
      </View>
    );
  }

  if (status === 'unavailable') {
    return (
      <View style={styles.centered}>
        <Text accessibilityRole="header" style={styles.title}>Session check unavailable</Text>
        <Text style={styles.body}>
          Your saved sign-in was kept securely. Check your connection and retry,
          or continue in the current app.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => void retrySession()}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Retry</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace('/web')}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>Open current app</Text>
        </Pressable>
      </View>
    );
  }

  if (user) return <Redirect href={returnHref} />;

  return (
    <NativeLoginScreen
      onSignIn={signIn}
      onSignedIn={() => router.replace(returnHref)}
      onUseCurrentApp={() => router.replace('/web')}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.xl,
    backgroundColor: '#06162f',
  },
  title: { color: '#fff', fontSize: theme.type.title, fontWeight: '800', textAlign: 'center' },
  body: { maxWidth: 420, color: '#cbd5e1', fontSize: theme.type.body, lineHeight: 21, textAlign: 'center' },
  primaryButton: {
    minHeight: 48,
    minWidth: 240,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.selectedBorder,
  },
  primaryButtonText: { color: '#fff', fontWeight: '800' },
  secondaryButton: {
    minHeight: 48,
    minWidth: 240,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#64748b',
    borderRadius: theme.radius.md,
  },
  secondaryButtonText: { color: '#e2e8f0', fontWeight: '700' },
});
