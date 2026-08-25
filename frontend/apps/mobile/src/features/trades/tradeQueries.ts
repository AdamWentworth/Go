import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AuthoritativeTradeProposalRequest } from '@pokemongonexus/shared-contracts/trades';
import { nativeCollectionQueryKeys } from '../collection/collectionQueries';
import { useNativeApiClients } from '../../services/useNativeApiClients';
import {
  createNativeTradeProposal,
  getNativeTrades,
} from '../../services/tradeApi';

export const nativeTradeQueryKeys = {
  root: ['native', 'trades'] as const,
  list: (userId: string) => ['native', 'trades', userId, 'list'] as const,
};

export const useNativeTradesQuery = (userId: string | null) => {
  const clients = useNativeApiClients();
  return useQuery({
    queryKey: nativeTradeQueryKeys.list(userId ?? 'signed-out'),
    queryFn: () => getNativeTrades(clients.users),
    enabled: Boolean(userId),
    staleTime: 30_000,
  });
};

export const useNativeCreateTradeProposal = (userId: string) => {
  const clients = useNativeApiClients();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (proposal: AuthoritativeTradeProposalRequest) => (
      createNativeTradeProposal(clients.users, proposal)
    ),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: nativeTradeQueryKeys.list(userId) }),
        queryClient.invalidateQueries({ queryKey: nativeCollectionQueryKeys.snapshot(userId) }),
      ]);
    },
  });
};
