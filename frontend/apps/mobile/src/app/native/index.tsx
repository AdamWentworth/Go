import { ApiClientError } from '@pokemongonexus/shared-api-client';
import type { CollectionSummary } from '@pokemongonexus/shared-contracts/users';
import { Redirect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNativeSession } from '../../auth/NativeSessionContext';
import { NativeHomeScreen } from '../../screens/NativeHomeScreen';
import { getCollectionSummary } from '../../services/collectionSummaryApi';
import { createNativeUsersApiClient } from '../../services/nativeApiClients';
import { theme } from '../../ui/theme';

export default function NativeHomeRoute() {
  const router = useRouter();
  const session = useNativeSession();
  const { retrySession, status, user, signOut } = session;
  const [summary, setSummary] = useState<CollectionSummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const usersApi = useMemo(() => createNativeUsersApiClient({
    getAccessToken: session.getAccessToken,
    refreshAccessToken: session.refreshAccessToken,
    clearSession: session.clearSession,
  }), [session.clearSession, session.getAccessToken, session.refreshAccessToken]);

  const loadSummary = useCallback(async () => {
    setIsSummaryLoading(true);
    setSummaryError(null);
    try {
      setSummary(await getCollectionSummary(usersApi));
    } catch (error) {
      setSummaryError(
        error instanceof ApiClientError || error instanceof Error
          ? error.message
          : 'Unable to load your collection.',
      );
    } finally {
      setIsSummaryLoading(false);
    }
  }, [usersApi]);

  useEffect(() => {
    if (status === 'signed-in') void loadSummary();
  }, [loadSummary, status]);

  if (status === 'restoring') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#5ed8ff" size="large" />
        <Text style={styles.body}>Restoring your secure session…</Text>
      </View>
    );
  }

  if (status === 'unavailable') {
    return (
      <View style={styles.centered}>
        <Text accessibilityRole="header" style={styles.title}>Session check unavailable</Text>
        <Text style={styles.body}>Your saved session was preserved. Retry when you are online.</Text>
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

  if (!user) return <Redirect href="/native/login" />;

  return <NativeHomeScreen
    username={user.username}
    summary={summary}
    isLoading={isSummaryLoading}
    error={summaryError}
    onRetry={() => void loadSummary()}
    onOpenNativeCollection={() => router.push('/native/collection')}
    onOpenCurrentApp={() => router.replace('/web')}
    onSignOut={() => void signOut()}
  />;
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
