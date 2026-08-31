import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { NativePvpScreen } from '../../screens/NativePvpScreen';
import { useNativeSession } from '../../auth/NativeSessionContext';
import { runtimeConfig } from '../../config/runtimeConfig';
import { useNativeCollectionSnapshotQuery } from '../../features/collection/collectionQueries';
import { hydrateNativeToolCatalog } from '../../features/tools/nativeBattleModels';
import { useNativeMovesDataQuery, useNativePvpDataQuery, useNativeToolCatalogQuery } from '../../features/tools/nativeToolQueries';
import { NativeActionMenu } from '../../components/NativeActionMenu';
import { NativeActionMenuAnchor } from '../../components/NativeActionMenuAnchor';
import { resolveNativeActionMenuDestination } from '../../navigation/nativeActionMenuNavigation';

export default function NativePvpRoute() {
  const router = useRouter();
  const session = useNativeSession();
  const [menu, setMenu] = useState(false);
  const catalogQuery = useNativeToolCatalogQuery();
  const movesQuery = useNativeMovesDataQuery();
  const rankingsQuery = useNativePvpDataQuery();
  const collectionQuery = useNativeCollectionSnapshotQuery(session.user?.user_id ?? null);
  const catalog = useMemo(
    () => hydrateNativeToolCatalog(catalogQuery.data ?? [], movesQuery.data ?? []),
    [catalogQuery.data, movesQuery.data],
  );
  const error = [catalogQuery.error, movesQuery.error, rankingsQuery.error, collectionQuery.error]
    .find((value): value is Error => value instanceof Error)?.message ?? null;
  const navigate = (path: string) => {
    setMenu(false);
    const destination = resolveNativeActionMenuDestination(path, '/pvp');
    if (destination.kind === 'current') return;
    if (destination.kind === 'native') router.push(destination.pathname);
    else router.push({ pathname: '/web', params: { path: destination.path } });
  };

  return (
    <>
      <NativePvpScreen
        assetBaseUrl={runtimeConfig.api.frontendAppUrl}
        catalog={catalog}
        error={error}
        instances={collectionQuery.data?.instances ?? {}}
        isLoading={catalogQuery.isPending || movesQuery.isPending || rankingsQuery.isPending || Boolean(session.user && collectionQuery.isPending)}
        onBack={() => router.canGoBack() ? router.back() : router.replace('/native')}
        onMethodology={() => router.push('/native/pvp-methodology')}
        onRetry={() => { void catalogQuery.refetch(); void movesQuery.refetch(); void rankingsQuery.refetch(); if (session.user) void collectionQuery.refetch(); }}
        payload={rankingsQuery.data ?? null}
        signedIn={Boolean(session.user)}
      />
      <NativeActionMenuAnchor assetBaseUrl={runtimeConfig.api.frontendAppUrl} onPress={() => setMenu(true)} />
      {menu ? <NativeActionMenu assetBaseUrl={runtimeConfig.api.frontendAppUrl} onClose={() => setMenu(false)} onNavigate={navigate} visible /> : null}
    </>
  );
}
