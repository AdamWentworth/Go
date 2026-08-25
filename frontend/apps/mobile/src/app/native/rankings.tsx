import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { buildPokemonCatalogEntries } from '@pokemongonexus/shared-domain/catalog';
import { useNativeSession } from '../../auth/NativeSessionContext';
import { NativeActionMenu } from '../../components/NativeActionMenu';
import { NativeActionMenuAnchor } from '../../components/NativeActionMenuAnchor';
import { runtimeConfig } from '../../config/runtimeConfig';
import { useNativeCollectionSnapshotQuery } from '../../features/collection/collectionQueries';
import type { NativeRankingCategory, NativeRankingCollectionFilter, NativeRankingMode } from '../../features/tools/nativeRankingsModel';
import { buildNativeRankingRows } from '../../features/tools/nativeRankingsModel';
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
  const rows = useMemo(() => buildNativeRankingRows({ catalog: buildPokemonCatalogEntries(catalogQuery.data ?? []), category, collectionFilter: session.user ? collectionFilter : 'all', instances: snapshotQuery.data?.instances, mode, payload: rankingsQuery.data, query }), [catalogQuery.data, category, collectionFilter, mode, query, rankingsQuery.data, session.user, snapshotQuery.data?.instances]);
  const navigate = (path: string) => { setMenu(false); const destination = resolveNativeActionMenuDestination(path, '/rankings'); if (destination.kind === 'current') return; if (destination.kind === 'native') { router.push(destination.pathname); return; } router.push({ pathname: '/web', params: { path: destination.path } }); };
  const error = [catalogQuery.error, rankingsQuery.error, snapshotQuery.error].find((value): value is Error => value instanceof Error)?.message ?? null;
  const updatedAt = rankingsQuery.data?.snapshot.updated_at;
  const snapshotLabel = updatedAt && !Number.isNaN(new Date(updatedAt).getTime()) ? `Updated ${new Date(updatedAt).toLocaleDateString()}` : 'Recently updated';
  return <><NativeRankingsScreen assetBaseUrl={runtimeConfig.api.frontendAppUrl} collectorCount={Math.max(rankingsQuery.data?.snapshot.collector_users ?? 0, rankingsQuery.data?.snapshot.wishlist_users ?? 0)} error={error} isLoading={catalogQuery.isPending || rankingsQuery.isPending || Boolean(session.user && snapshotQuery.isPending)} onBack={() => router.canGoBack() ? router.back() : router.replace('/native')} onChangeCategory={setCategory} onChangeCollectionFilter={setCollectionFilter} onChangeMode={(next) => { setMode(next); if (next === 'wanted' && category === 'shadow') setCategory('all'); }} onChangeQuery={setQuery} onOpenEntry={({ entry }) => router.push({ pathname: '/native/pokedex/[variantId]', params: { variantId: entry.id } })} onRetry={() => { void catalogQuery.refetch(); void rankingsQuery.refetch(); if (session.user) void snapshotQuery.refetch(); }} privacyThreshold={rankingsQuery.data?.privacy_threshold ?? 3} rows={rows} selectedCategory={category} selectedCollectionFilter={collectionFilter} selectedMode={mode} showCollectionFilters={Boolean(session.user)} snapshotLabel={snapshotLabel} /><NativeActionMenuAnchor assetBaseUrl={runtimeConfig.api.frontendAppUrl} onPress={() => setMenu(true)} />{menu ? <NativeActionMenu assetBaseUrl={runtimeConfig.api.frontendAppUrl} onClose={() => setMenu(false)} onNavigate={navigate} visible /> : null}</>;
}

