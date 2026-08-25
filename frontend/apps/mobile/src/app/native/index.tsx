import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { useNativeSession } from '../../auth/NativeSessionContext';
import { NativeActionMenu } from '../../components/NativeActionMenu';
import { NativeActionMenuAnchor } from '../../components/NativeActionMenuAnchor';
import { runtimeConfig } from '../../config/runtimeConfig';
import {
  buildNativeCollectionRows,
} from '../../features/collection/collectionModel';
import { useNativeCollectionSnapshotQuery } from '../../features/collection/collectionQueries';
import {
  EMPTY_NATIVE_HOME_COLLECTION,
  EMPTY_NATIVE_HOME_TRADES,
  selectNativeHomeRecentRows,
  summarizeNativeHomeCollection,
  summarizeNativeHomeTrades,
} from '../../features/home/nativeHomeDashboardModel';
import { useNativeFriendsQuery } from '../../features/social/socialQueries';
import { useNativeTradesQuery } from '../../features/trades/tradeQueries';
import { isNativeInformationSlug } from '../../features/information/nativeInformationContent';
import { resolveNativeActionMenuDestination } from '../../navigation/nativeActionMenuNavigation';
import { NativeGuestHomeScreen } from '../../screens/NativeGuestHomeScreen';
import { NativeHomeScreen } from '../../screens/NativeHomeScreen';

const hintStorageKey = (userId: string): string => (
  `pokegonexus-native-home-action-menu-hint:${userId}`
);

export default function NativeHomeRoute() {
  const router = useRouter();
  const session = useNativeSession();
  const light = useColorScheme() === 'light';
  const userId = session.user?.user_id ?? null;
  const collectionQuery = useNativeCollectionSnapshotQuery(userId);
  const tradesQuery = useNativeTradesQuery(userId);
  const friendsQuery = useNativeFriendsQuery(userId);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [showActionMenuHint, setShowActionMenuHint] = useState(false);

  const navigate = (path: string) => {
    setActionMenuOpen(false);
    const [pathname = '/', search = ''] = path.split('?');
    const params = new URLSearchParams(search);

    if (pathname === '/') return;
    if (isNativeInformationSlug(pathname.slice(1))) {
      router.push({ pathname: '/native/info/[slug]', params: { slug: pathname.slice(1) } });
      return;
    }
    if (pathname === '/login') {
      router.push('/native/login');
      return;
    }
    if (pathname === '/register') {
      router.push('/native/register');
      return;
    }
    if (pathname === '/pokemon') {
      const instanceId = params.get('instanceId');
      if (instanceId) {
        router.push({ pathname: '/native/collection/[instanceId]', params: { instanceId } });
        return;
      }
      const filter = params.get('filter');
      router.push(filter
        ? { pathname: '/native/collection', params: { filter } }
        : '/native/collection');
      return;
    }
    if (pathname === '/pokedex') {
      router.push('/native/pokedex');
      return;
    }
    if (pathname === '/trades') {
      const section = params.get('section');
      router.push(section
        ? { pathname: '/native/trades', params: { section } }
        : '/native/trades');
      return;
    }
    if (pathname === '/profile/friends') {
      router.push('/native/friends');
      return;
    }
    if (pathname === '/profile') {
      router.push('/native/profile');
      return;
    }
    if (pathname === '/search') {
      router.push('/native/search');
      return;
    }
    if (pathname === '/settings') {
      router.push('/native/settings');
      return;
    }
    if (pathname === '/settings/account') {
      router.push('/native/account');
      return;
    }
    if (pathname === '/trade-board') {
      router.push('/native/trade-board');
      return;
    }
    router.push({ pathname: '/web', params: { path } });
  };
  const navigateFromActionMenu = (path: string) => {
    const destination = resolveNativeActionMenuDestination(path, '/');
    if (destination.kind === 'current') {
      setActionMenuOpen(false);
      return;
    }
    if (destination.kind === 'native') {
      setActionMenuOpen(false);
      router.push(destination.pathname);
      return;
    }
    navigate(destination.path);
  };

  useEffect(() => {
    if (!userId) return undefined;
    let active = true;
    void SecureStore.getItemAsync(hintStorageKey(userId))
      .then((value) => { if (active) setShowActionMenuHint(value !== 'dismissed'); })
      .catch(() => { if (active) setShowActionMenuHint(true); });
    return () => { active = false; };
  }, [userId]);

  const rows = useMemo(() => {
    if (!collectionQuery.data) return [];
    return buildNativeCollectionRows(
      collectionQuery.data.instances,
      collectionQuery.data.catalog,
      runtimeConfig.api.frontendAppUrl,
    );
  }, [collectionQuery.data]);
  const collection = useMemo(() => (
    collectionQuery.data
      ? summarizeNativeHomeCollection(collectionQuery.data.instances)
      : EMPTY_NATIVE_HOME_COLLECTION
  ), [collectionQuery.data]);
  const trades = useMemo(() => (
    tradesQuery.data && session.user
      ? summarizeNativeHomeTrades(tradesQuery.data.trades, session.user.username)
      : EMPTY_NATIVE_HOME_TRADES
  ), [session.user, tradesQuery.data]);
  const recentRows = useMemo(() => (
    collectionQuery.data
      ? selectNativeHomeRecentRows(rows, collectionQuery.data.instances)
      : []
  ), [collectionQuery.data, rows]);

  if (session.status === 'restoring') {
    return (
      <View style={[styles.status, light && styles.statusLight]}>
        <ActivityIndicator color="#299cf5" size="large" />
        <Text style={[styles.statusText, light && styles.statusTextLight]}>Opening Pokémon Go Nexus…</Text>
      </View>
    );
  }

  if (session.status === 'unavailable') {
    return (
      <View style={[styles.status, light && styles.statusLight]}>
        <Text accessibilityRole="header" style={[styles.statusTitle, light && styles.statusTextLight]}>Session check unavailable</Text>
        <Text style={[styles.statusText, light && styles.statusMutedLight]}>Your saved session is still secure. Retry when you are online.</Text>
        <Pressable accessibilityRole="button" onPress={() => void session.retrySession()} style={styles.retry}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (!session.user) {
    return (
      <View style={styles.root}>
        <NativeGuestHomeScreen assetBaseUrl={runtimeConfig.api.frontendAppUrl} onNavigate={navigate} />
        <NativeActionMenuAnchor assetBaseUrl={runtimeConfig.api.frontendAppUrl} onPress={() => setActionMenuOpen(true)} />
        {actionMenuOpen ? (
          <NativeActionMenu
            assetBaseUrl={runtimeConfig.api.frontendAppUrl}
            onClose={() => setActionMenuOpen(false)}
            onNavigate={navigateFromActionMenu}
            visible
          />
        ) : null}
      </View>
    );
  }
  const signedInUser = session.user;
  const dismissActionMenuHint = () => {
    setShowActionMenuHint(false);
    void SecureStore.setItemAsync(hintStorageKey(signedInUser.user_id), 'dismissed');
  };
  const queryErrors = [collectionQuery.error, tradesQuery.error]
    .filter((error): error is Error => error instanceof Error)
    .map((error) => error.message)
    .filter(Boolean);

  return (
    <View style={styles.root}>
      <NativeHomeScreen
        assetBaseUrl={runtimeConfig.api.frontendAppUrl}
        collection={collection}
        error={queryErrors.length ? queryErrors.join(' ') : null}
        friendsState={friendsQuery.isPending ? 'loading' : friendsQuery.isError ? 'error' : 'ready'}
        incomingFriends={friendsQuery.data?.incoming.length ?? 0}
        isLoading={collectionQuery.isPending || tradesQuery.isPending}
        onDismissActionMenuHint={dismissActionMenuHint}
        onNavigate={navigate}
        onRetry={() => {
          void collectionQuery.refetch();
          void tradesQuery.refetch();
          void friendsQuery.refetch();
        }}
        pokemonGoName={signedInUser.pokemonGoName}
        recentRows={recentRows}
        showActionMenuHint={showActionMenuHint}
        trades={trades}
        username={signedInUser.username}
      />
      <NativeActionMenuAnchor
        assetBaseUrl={runtimeConfig.api.frontendAppUrl}
        onPress={() => setActionMenuOpen(true)}
      />
      {actionMenuOpen ? (
        <NativeActionMenu
          assetBaseUrl={runtimeConfig.api.frontendAppUrl}
          onClose={() => setActionMenuOpen(false)}
          onNavigate={navigateFromActionMenu}
          visible
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 0 },
  status: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24, backgroundColor: '#071012' },
  statusLight: { backgroundColor: '#eef7f3' },
  statusTitle: { color: '#f4fbfd', fontSize: 23, fontWeight: '900', textAlign: 'center' },
  statusText: { maxWidth: 420, color: '#bac8ca', fontSize: 15, lineHeight: 21, textAlign: 'center' },
  statusTextLight: { color: '#193d40' },
  statusMutedLight: { color: '#597073' },
  retry: { minWidth: 210, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#299cf5' },
  retryText: { color: '#071012', fontWeight: '900' },
});
