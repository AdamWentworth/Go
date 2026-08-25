import { Redirect, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useNativeSession } from '../../auth/NativeSessionContext';
import { NativeActionMenu } from '../../components/NativeActionMenu';
import { runtimeConfig } from '../../config/runtimeConfig';
import {
  buildNativeCollectionRows,
} from '../../features/collection/collectionModel';
import { useNativeCollectionSnapshotQuery } from '../../features/collection/collectionQueries';
import { useNativeTrainerProfileQuery } from '../../features/social/socialQueries';
import { buildNativeTradeBoardModel } from '../../features/tradeBoard/nativeTradeBoardModel';
import { resolveNativeActionMenuDestination } from '../../navigation/nativeActionMenuNavigation';
import { NativeTradeBoardScreen } from '../../screens/NativeTradeBoardScreen';

export default function NativeTradeBoardRoute() {
  const router = useRouter();
  const session = useNativeSession();
  const [generatedAt] = useState(() => new Date().toISOString());
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const userId = session.user?.user_id ?? null;
  const snapshotQuery = useNativeCollectionSnapshotQuery(userId);
  const profileQuery = useNativeTrainerProfileQuery(userId);
  const rows = useMemo(() => snapshotQuery.data ? buildNativeCollectionRows(
    snapshotQuery.data.instances,
    snapshotQuery.data.catalog,
    runtimeConfig.api.frontendAppUrl,
  ) : [], [snapshotQuery.data]);
  const model = useMemo(() => {
    if (!snapshotQuery.data || !session.user) return null;
    const username = session.user.username;
    return buildNativeTradeBoardModel({
      boardUrl: `${runtimeConfig.api.frontendAppUrl.replace(/\/$/, '')}/trade-board/${encodeURIComponent(username)}`,
      generatedAt,
      instances: snapshotQuery.data.instances,
      pokemonGoName: profileQuery.data?.user.pokemonGoName,
      rows,
      username,
    });
  }, [generatedAt, profileQuery.data?.user.pokemonGoName, rows, session.user, snapshotQuery.data]);

  if (session.status !== 'signed-in' || !session.user) {
    return <Redirect href="/native/login?returnTo=%2Fnative%2Ftrade-board" />;
  }

  const navigateFromActionMenu = (path: string) => {
    setActionMenuOpen(false);
    if (path === '/trade-board') return;
    const destination = resolveNativeActionMenuDestination(path);
    if (destination.kind === 'native') {
      router.push(destination.pathname);
      return;
    }
    if (destination.kind === 'current') return;
    router.push({ pathname: '/web', params: { path: destination.path } });
  };
  const error = [snapshotQuery.error, profileQuery.error]
    .find((value): value is Error => value instanceof Error)?.message ?? null;

  return (
    <>
      <NativeTradeBoardScreen
        assetBaseUrl={runtimeConfig.api.frontendAppUrl}
        error={error}
        isLoading={snapshotQuery.isPending || profileQuery.isPending}
        model={model}
        onActionMenuPress={() => setActionMenuOpen(true)}
        onBack={() => {
          if (router.canGoBack()) router.back();
          else router.replace('/native/trades');
        }}
        onOpenCollection={() => router.push('/native/collection')}
        onRetry={() => {
          void snapshotQuery.refetch();
          void profileQuery.refetch();
        }}
      />
      {actionMenuOpen ? (
        <NativeActionMenu
          assetBaseUrl={runtimeConfig.api.frontendAppUrl}
          onClose={() => setActionMenuOpen(false)}
          onNavigate={navigateFromActionMenu}
          visible
        />
      ) : null}
    </>
  );
}
