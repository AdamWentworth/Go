import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { buildPokemonCatalogEntries } from '@pokemongonexus/shared-domain/catalog';
import { useNativeSession } from '../../auth/NativeSessionContext';
import { NativeActionMenu } from '../../components/NativeActionMenu';
import { NativeActionMenuAnchor } from '../../components/NativeActionMenuAnchor';
import { runtimeConfig } from '../../config/runtimeConfig';
import { useNativeCollectionSnapshotQuery } from '../../features/collection/collectionQueries';
import type { NativeRankingCategory, NativeRankingCollectionFilter, NativeRankingMode } from '../../features/tools/nativeRankingsModel';
import { buildNativeRankingRows, countNativeRankingCollectionFilters, filterNativeRankingRowsByCollection } from '../../features/tools/nativeRankingsModel';
import { useNativeCommunityRankingsQuery, useNativeToolCatalogQuery } from '../../features/tools/nativeToolQueries';
import { resolveNativeActionMenuDestination } from '../../navigation/nativeActionMenuNavigation';
import { NativeRankingsScreen } from '../../screens/NativeRankingsScreen';

export default function NativeRankingsRoute() {
  const router = useRouter();
  const session = useNativeSession();
  const catalogQuery = useNativeToolCatalogQuery();
  const rankingsQuery = useNativeCommunityRankingsQuery();
  const snapshotQuery = useNativeCollectionSnapshotQuery(session.user?.user_id ?? null);
  const [mode, setMode] = useState<NativeRankingMode>('wanted');
  const [category, setCategory] = useState<NativeRankingCategory>('all');
  const [collectionFilter, setCollectionFilter] = useState<NativeRankingCollectionFilter>('all');
  const [query, setQuery] = useState('');
  const [menu, setMenu] = useState(false);
  const rowsBeforeCollectionFilter = useMemo(() => buildNativeRankingRows({ catalog: buildPokemonCatalogEntries(catalogQuery.data ?? []), category, collectionFilter: 'all', instances: snapshotQuery.data?.instances, mode, payload: rankingsQuery.data, query }), [catalogQuery.data, category, mode, query, rankingsQuery.data, snapshotQuery.data?.instances]);
  const collectionFilterCounts = useMemo(() => countNativeRankingCollectionFilters(rowsBeforeCollectionFilter), [rowsBeforeCollectionFilter]);
  const rows = useMemo(() => filterNativeRankingRowsByCollection(rowsBeforeCollectionFilter, session.user ? collectionFilter : 'all'), [collectionFilter, rowsBeforeCollectionFilter, session.user]);
  const navigate = (path: string) => { setMenu(false); const destination = resolveNativeActionMenuDestination(path, '/rankings'); if (destination.kind === 'current') return; if (destination.kind === 'native') { router.push(destination.pathname); return; } router.push({ pathname: '/web', params: { path: destination.path } }); };
  const error = [catalogQuery.error, rankingsQuery.error, snapshotQuery.error].find((value): value is Error => value instanceof Error)?.message ?? null;
  const updatedAt = rankingsQuery.data?.snapshot.updated_at;
  const snapshotLabel = updatedAt && !Number.isNaN(new Date(updatedAt).getTime())
    ? `Updated ${new Date(updatedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}`
    : 'Recently updated';
  const retry = () => {
    void catalogQuery.refetch();
    void rankingsQuery.refetch();
    if (session.user) void snapshotQuery.refetch();
  };
  const openRankingEntry = ({ entry, personal }: (typeof rows)[number]) => {
    if (!session.user) {
      router.push({ pathname: '/native/pokedex/[variantId]', params: { variantId: entry.id } });
      return;
    }
    const filter = personal.tradeCount > 0
      ? 'trade'
      : personal.wanted
        ? 'wanted'
        : personal.registered
          ? 'caught'
          : '';
    router.push({
      pathname: '/native/collection',
      params: { ...(filter ? { filter } : {}), search: entry.name },
    });
  };
  return <>
    <NativeRankingsScreen
      assetBaseUrl={runtimeConfig.api.frontendAppUrl}
      collectionFilterCounts={collectionFilterCounts}
      collectorCount={Math.max(rankingsQuery.data?.snapshot.collector_users ?? 0, rankingsQuery.data?.snapshot.wishlist_users ?? 0)}
      error={error}
      hasSnapshot={Boolean(rankingsQuery.data)}
      isLoading={catalogQuery.isPending || rankingsQuery.isPending || Boolean(session.user && snapshotQuery.isPending)}
      isRefreshing={catalogQuery.isFetching || rankingsQuery.isFetching || Boolean(session.user && snapshotQuery.isFetching)}
      onBack={() => router.canGoBack() ? router.back() : router.replace('/native')}
      onChangeCategory={setCategory}
      onChangeCollectionFilter={setCollectionFilter}
      onChangeMode={(next) => {
        setMode(next);
        if (next === 'wanted' && category === 'shadow') setCategory('all');
      }}
      onChangeQuery={setQuery}
      onOpenEntry={openRankingEntry}
      onRetry={retry}
      privacyThreshold={rankingsQuery.data?.privacy_threshold ?? 3}
      rows={rows}
      selectedCategory={category}
      selectedCollectionFilter={collectionFilter}
      selectedMode={mode}
      showCollectionFilters={Boolean(session.user)}
      snapshotLabel={snapshotLabel}
    />
    <NativeActionMenuAnchor assetBaseUrl={runtimeConfig.api.frontendAppUrl} onPress={() => setMenu(true)} />
    {menu ? <NativeActionMenu assetBaseUrl={runtimeConfig.api.frontendAppUrl} onClose={() => setMenu(false)} onNavigate={navigate} visible /> : null}
  </>;
}
