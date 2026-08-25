import type { PokemonSearchQueryParams } from '@pokemongonexus/shared-contracts/search';
import type { MobileSessionUser } from '@pokemongonexus/shared-contracts/auth';
import { Redirect, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNativeSession } from '../../auth/NativeSessionContext';
import { NativeActionMenu } from '../../components/NativeActionMenu';
import { NativeActionMenuAnchor } from '../../components/NativeActionMenuAnchor';
import {
  NativeHorizontalPageSlider,
  type NativeHorizontalPageSliderHandle,
} from '../../components/NativeHorizontalPageSlider';
import { runtimeConfig } from '../../config/runtimeConfig';
import { useNativeCollectionSnapshotQuery } from '../../features/collection/collectionQueries';
import {
  createNativePokemonSearchDraft,
  type NativePokemonSearchDraft,
} from '../../features/search/nativePokemonSearchDraft';
import { buildNativePokemonSearchResults } from '../../features/search/pokemonSearchModel';
import {
  NativeSearchHubHeader,
  type NativeSearchHubView,
} from '../../features/search/NativeSearchHubHeader';
import {
  useNativePokemonSearchQuery,
  useNativeTrainerSearchQuery,
} from '../../features/search/searchQueries';
import { NativePokemonSearchScreen } from '../../screens/NativePokemonSearchScreen';
import { NativeTrainerSearchScreen } from '../../screens/NativeTrainerSearchScreen';

const SEARCH_VIEWS: NativeSearchHubView[] = ['pokemon', 'trainers'];

const errorMessage = (error: unknown): string | null => (
  error instanceof Error ? error.message : error ? 'The request could not be completed.' : null
);

const NativeSignedInSearchRoute = ({ user }: { user: MobileSessionUser }) => {
  const router = useRouter();
  const light = useColorScheme() === 'light';
  const snapshotQuery = useNativeCollectionSnapshotQuery(user.user_id);
  const [activeView, setActiveView] = useState<NativeSearchHubView>('pokemon');
  const [pageScrollX] = useState(() => new Animated.Value(0));
  const sliderRef = useRef<NativeHorizontalPageSliderHandle>(null);
  const [draft, setDraft] = useState<NativePokemonSearchDraft>(() => (
    createNativePokemonSearchDraft({
      city: user.location,
      latitude: user.coordinates?.latitude,
      longitude: user.coordinates?.longitude,
    })
  ));
  const [executedDraft, setExecutedDraft] = useState<NativePokemonSearchDraft | null>(null);
  const [pokemonQuery, setPokemonQuery] = useState<PokemonSearchQueryParams | null>(null);
  const [trainerQuery, setTrainerQuery] = useState('');
  const [debouncedTrainerQuery, setDebouncedTrainerQuery] = useState('');
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const pokemonSearch = useNativePokemonSearchQuery(pokemonQuery);
  const trainerSearch = useNativeTrainerSearchQuery(
    debouncedTrainerQuery,
    debouncedTrainerQuery.trim().length >= 2,
  );
  const activeIndex = SEARCH_VIEWS.indexOf(activeView);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTrainerQuery(trainerQuery.trim()), 250);
    return () => clearTimeout(timer);
  }, [trainerQuery]);

  const changeView = useCallback((view: NativeSearchHubView) => {
    setActiveView(view);
    sliderRef.current?.setPage(SEARCH_VIEWS.indexOf(view));
  }, []);

  const results = useMemo(() => {
    if (!snapshotQuery.data || !executedDraft || !pokemonSearch.data) return [];
    return buildNativePokemonSearchResults({
      assetOrigin: runtimeConfig.api.frontendAppUrl,
      catalog: snapshotQuery.data.catalog,
      mode: executedDraft.ownership,
      results: pokemonSearch.data,
    });
  }, [executedDraft, pokemonSearch.data, snapshotQuery.data]);

  const searchNotice = pokemonQuery && !pokemonSearch.isFetching && pokemonSearch.data
    ? `Search complete · ${pokemonSearch.data.length} ${pokemonSearch.data.length === 1 ? 'listing' : 'listings'} found.`
    : null;
  const savedLocation = user.coordinates && user.location
    ? {
        label: user.location,
        latitude: user.coordinates.latitude,
        longitude: user.coordinates.longitude,
      }
    : null;

  const openWebProfile = (username: string) => router.push({
    pathname: '/web',
    params: { path: `/profile/${encodeURIComponent(username)}` },
  });
  const openForeignCatalog = (username: string) => router.push({
    pathname: '/native/collection/trainer/[username]',
    params: { username },
  });
  const navigateFromActionMenu = (path: string) => {
    setActionMenuOpen(false);
    if (path === '/search') return;
    if (path === '/pokemon') {
      router.push('/native/collection');
      return;
    }
    if (path === '/trades') {
      router.push('/native/trades');
      return;
    }
    router.push({ pathname: '/web', params: { path } });
  };

  const pokemonPanel = snapshotQuery.isPending ? (
    <View style={[styles.state, light && styles.stateLight]}>
      <ActivityIndicator color="#2f9cff" size="large" />
      <Text style={[styles.stateTitle, light && styles.textLight]}>Loading Pokémon search</Text>
      <Text style={[styles.stateCopy, light && styles.secondaryLight]}>
        Preparing the Pokémon catalog and your match information…
      </Text>
    </View>
  ) : snapshotQuery.error || !snapshotQuery.data ? (
    <View style={[styles.state, styles.errorState, light && styles.stateLight]}>
      <Text style={styles.errorIcon}>!</Text>
      <Text style={[styles.stateTitle, light && styles.textLight]}>Pokémon search is unavailable</Text>
      <Text style={[styles.stateCopy, light && styles.secondaryLight]}>
        {errorMessage(snapshotQuery.error) ?? 'The Pokémon catalog could not be loaded.'}
      </Text>
    </View>
  ) : (
    <NativePokemonSearchScreen
      assetBaseUrl={runtimeConfig.api.frontendAppUrl}
      catalog={snapshotQuery.data.catalog}
      draft={draft}
      error={errorMessage(pokemonSearch.error)}
      hasSearched={Boolean(pokemonQuery)}
      isLoading={pokemonSearch.isFetching}
      notice={searchNotice}
      onDraftChange={setDraft}
      onOpenListing={(result) => router.push({
        pathname: '/native/collection/trainer/[username]/[instanceId]',
        params: { username: result.username, instanceId: result.id },
      })}
      onOpenProfile={openWebProfile}
      onRetry={() => void pokemonSearch.refetch()}
      onSearch={(query, nextDraft) => {
        setExecutedDraft(nextDraft);
        setPokemonQuery(query);
      }}
      results={results}
      savedLocation={savedLocation}
    />
  );

  return (
    <View style={[styles.screen, light && styles.screenLight]} testID="native-search-route">
      <NativeSearchHubHeader
        activeView={activeView}
        onViewChange={changeView}
        scrollX={pageScrollX}
      />
      <NativeHorizontalPageSlider
        activeIndex={activeIndex}
        onIndexChange={(index) => setActiveView(SEARCH_VIEWS[index] ?? 'pokemon')}
        ref={sliderRef}
        scrollX={pageScrollX}
      >
        {pokemonPanel}
        <NativeTrainerSearchScreen
          entries={trainerQuery.trim().length >= 2 ? trainerSearch.data ?? [] : []}
          error={errorMessage(trainerSearch.error)}
          isLoading={trainerSearch.isFetching}
          onOpenCatalog={openForeignCatalog}
          onOpenProfile={openWebProfile}
          onQueryChange={setTrainerQuery}
          onRetry={() => void trainerSearch.refetch()}
          query={trainerQuery}
        />
      </NativeHorizontalPageSlider>
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
};

export default function NativeSearchRoute() {
  const session = useNativeSession();
  if (session.status !== 'signed-in' || !session.user) {
    return <Redirect href="/native/login?returnTo=%2Fnative%2Fsearch" />;
  }
  return <NativeSignedInSearchRoute user={session.user} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, minHeight: 0, backgroundColor: '#080d0f' },
  screenLight: { backgroundColor: '#eef4f5' },
  state: {
    flex: 1,
    minHeight: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    margin: 10,
    padding: 24,
    borderWidth: 1,
    borderColor: '#34484c',
    borderRadius: 14,
    backgroundColor: '#141c1e',
  },
  stateLight: { borderColor: '#b4c1c3', backgroundColor: '#ffffff' },
  errorState: { borderColor: '#b94e61' },
  errorIcon: { color: '#ff6e83', fontSize: 28, fontWeight: '900' },
  stateTitle: { color: '#f6fafb', fontSize: 18, fontWeight: '900', textAlign: 'center' },
  stateCopy: { maxWidth: 460, color: '#a6b1b3', fontSize: 13, lineHeight: 19, textAlign: 'center' },
  textLight: { color: '#172124' },
  secondaryLight: { color: '#566467' },
});
