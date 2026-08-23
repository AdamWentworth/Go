import { useQuery } from '@tanstack/react-query';
import {
  getReconciledNativeCollectionSnapshot,
  getNativePokemonMoves,
} from '../../services/collectionApi';
import { getCollectionSummary } from '../../services/collectionSummaryApi';
import { useNativeApiClients } from '../../services/useNativeApiClients';
import { nativeCollectionOutbox } from '../../storage/nativeCollectionOutbox';
import { nativeCollectionCache } from '../../storage/nativeCollectionCache';

export const nativeCollectionQueryKeys = {
  root: ['native', 'collection'] as const,
  summary: (userId: string) =>
    [...nativeCollectionQueryKeys.root, userId, 'summary'] as const,
  snapshot: (userId: string) =>
    [...nativeCollectionQueryKeys.root, userId, 'snapshot'] as const,
  moves: ['native', 'pokemon', 'moves'] as const,
};

export const useNativePokemonMovesQuery = (enabled: boolean) => {
  const clients = useNativeApiClients();
  return useQuery({
    queryKey: nativeCollectionQueryKeys.moves,
    queryFn: () => getNativePokemonMoves(clients.pokemon),
    enabled,
    staleTime: Number.POSITIVE_INFINITY,
  });
};

export const useNativeCollectionSummaryQuery = (
  userId: string | null,
) => {
  const clients = useNativeApiClients();
  return useQuery({
    queryKey: nativeCollectionQueryKeys.summary(userId ?? 'signed-out'),
    queryFn: () => getCollectionSummary(clients.users),
    enabled: Boolean(userId),
    staleTime: 30_000,
  });
};

export const useNativeCollectionSnapshotQuery = (
  userId: string | null,
) => {
  const clients = useNativeApiClients();
  return useQuery({
    queryKey: nativeCollectionQueryKeys.snapshot(userId ?? 'signed-out'),
    queryFn: () => getReconciledNativeCollectionSnapshot(
      clients.users,
      clients.pokemon,
      nativeCollectionOutbox,
      nativeCollectionCache,
      userId ?? '',
    ),
    enabled: Boolean(userId),
    staleTime: 5 * 60_000,
  });
};
