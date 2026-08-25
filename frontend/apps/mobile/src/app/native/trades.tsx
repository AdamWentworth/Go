import { Redirect, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useNativeSession } from '../../auth/NativeSessionContext';
import { runtimeConfig } from '../../config/runtimeConfig';
import {
  useNativeCollectionSnapshotQuery,
  useNativePokemonMovesQuery,
} from '../../features/collection/collectionQueries';
import { buildNativeTradeActivityRows } from '../../features/trades/nativeTradeActivityRows';
import { executeNativeTradeActivityAction } from '../../features/trades/nativeTradeActivityCommands';
import {
  useNativeDeleteTradeMutation,
  useNativeTradeCommand,
  useNativeTradesQuery,
  useNativeTradeSatisfactionMutation,
} from '../../features/trades/tradeQueries';
import { getNativeTradePartnerInfo } from '../../services/tradeApi';
import { useNativeApiClients } from '../../services/useNativeApiClients';
import { NativeTradeActivityScreen } from '../../screens/NativeTradeActivityScreen';

export default function NativeTradeActivityRoute() {
  const router = useRouter();
  const session = useNativeSession();
  const clients = useNativeApiClients();
  const userId = session.user?.user_id ?? 'signed-out';
  const tradesQuery = useNativeTradesQuery(session.user?.user_id ?? null);
  const collectionQuery = useNativeCollectionSnapshotQuery(session.user?.user_id ?? null);
  const movesQuery = useNativePokemonMovesQuery(Boolean(session.user));
  const accept = useNativeTradeCommand(userId, 'accept');
  const deny = useNativeTradeCommand(userId, 'deny');
  const cancel = useNativeTradeCommand(userId, 'cancel');
  const complete = useNativeTradeCommand(userId, 'complete');
  const repropose = useNativeTradeCommand(userId, 'repropose');
  const satisfaction = useNativeTradeSatisfactionMutation(userId);
  const remove = useNativeDeleteTradeMutation(userId);
  const rows = useMemo(() => {
    if (!tradesQuery.data || !collectionQuery.data) return [];
    return buildNativeTradeActivityRows({
      assetOrigin: runtimeConfig.api.frontendAppUrl,
      catalog: collectionQuery.data.catalog,
      currentUsername: session.user?.username ?? '',
      envelope: tradesQuery.data,
      moves: movesQuery.data ?? [],
    });
  }, [collectionQuery.data, movesQuery.data, session.user?.username, tradesQuery.data]);

  if (session.status !== 'signed-in' || !session.user) {
    return <Redirect href="/native/login?returnTo=%2Fnative%2Ftrades" />;
  }

  const errors = [tradesQuery.error, collectionQuery.error]
    .filter((error): error is Error => error instanceof Error)
    .map((error) => error.message);

  return (
    <NativeTradeActivityScreen
      assetBaseUrl={runtimeConfig.api.frontendAppUrl}
      error={errors.length ? errors.join(' ') : null}
      isLoading={tradesQuery.isPending || collectionQuery.isPending}
      onAction={(model, action) => executeNativeTradeActivityAction(
        model.tradeId,
        action,
        {
          accept: accept.mutateAsync,
          cancel: cancel.mutateAsync,
          complete: complete.mutateAsync,
          delete: remove.mutateAsync,
          deny: deny.mutateAsync,
          repropose: repropose.mutateAsync,
          satisfy: (tradeId) => satisfaction.mutateAsync({ tradeId, satisfied: true }),
        },
      )}
      onOpenPreferences={() => router.push({
        pathname: '/web',
        params: { path: '/trades' },
      })}
      onRetry={() => {
        void tradesQuery.refetch();
        void collectionQuery.refetch();
      }}
      onRevealPartner={(tradeId) => getNativeTradePartnerInfo(clients.users, tradeId)}
      rows={rows}
    />
  );
}
