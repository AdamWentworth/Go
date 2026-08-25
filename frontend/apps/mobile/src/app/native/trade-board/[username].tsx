import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useNativeSession } from '../../../auth/NativeSessionContext';
import { NativeActionMenu } from '../../../components/NativeActionMenu';
import { runtimeConfig } from '../../../config/runtimeConfig';
import { buildNativeCollectionRows } from '../../../features/collection/collectionModel';
import { useNativeForeignCollectionQuery } from '../../../features/collection/collectionQueries';
import { useNativeTrainerProfileQuery } from '../../../features/social/socialQueries';
import { buildNativeTradeBoardModel } from '../../../features/tradeBoard/nativeTradeBoardModel';
import { resolveNativeActionMenuDestination } from '../../../navigation/nativeActionMenuNavigation';
import { NativeTradeBoardScreen } from '../../../screens/NativeTradeBoardScreen';

const firstParam = (value: string | string[] | undefined): string => (
  Array.isArray(value) ? value[0] ?? '' : value ?? ''
);

export default function NativePublicTradeBoardRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ username?: string | string[] }>();
  const session = useNativeSession();
  const username = firstParam(params.username).trim();
  const [generatedAt] = useState(() => new Date().toISOString());
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const viewerId = session.user?.user_id ?? null;
  const collectionQuery = useNativeForeignCollectionQuery(viewerId, username);
  const profileQuery = useNativeTrainerProfileQuery(viewerId, username);
  const success = collectionQuery.data?.type === 'success' ? collectionQuery.data : null;
  const rows = useMemo(() => success ? buildNativeCollectionRows(
    success.instances,
    success.catalog,
    runtimeConfig.api.frontendAppUrl,
  ) : [], [success]);
  const model = useMemo(() => {
    if (!success || !username) return null;
    return buildNativeTradeBoardModel({
      boardUrl: `${runtimeConfig.api.frontendAppUrl.replace(/\/$/, '')}/trade-board/${encodeURIComponent(username)}`,
      generatedAt,
      instances: success.instances,
      pokemonGoName: profileQuery.data?.user.pokemonGoName,
      rows,
      username: success.username || username,
    });
  }, [generatedAt, profileQuery.data?.user.pokemonGoName, rows, success, username]);
  const resultError = collectionQuery.error instanceof Error
    ? collectionQuery.error.message
    : profileQuery.error instanceof Error
      ? profileQuery.error.message
      : collectionQuery.data?.type === 'forbidden'
        ? collectionQuery.data.message
        : collectionQuery.data?.type === 'not-found'
          ? 'This trainer could not be found.'
          : null;

  const navigateFromActionMenu = (path: string) => {
    setActionMenuOpen(false);
    const destination = resolveNativeActionMenuDestination(path);
    if (destination.kind === 'current') return;
    if (destination.kind === 'native') {
      router.push(destination.pathname);
      return;
    }
    router.push({ pathname: '/web', params: { path: destination.path } });
  };

  return (
    <>
      <NativeTradeBoardScreen
        assetBaseUrl={runtimeConfig.api.frontendAppUrl}
        editable={false}
        error={resultError}
        isLoading={collectionQuery.isPending || profileQuery.isPending}
        model={model}
        onActionMenuPress={() => setActionMenuOpen(true)}
        onBack={() => router.canGoBack() ? router.back() : router.replace('/native/search')}
        onOpenCollection={() => router.push({
          pathname: '/native/collection/trainer/[username]',
          params: { username },
        })}
        onRetry={() => {
          void collectionQuery.refetch();
          void profileQuery.refetch();
        }}
        ownerUsername={username}
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
