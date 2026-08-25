import { useQuery } from '@tanstack/react-query';
import { useNativeApiClients } from '../../services/useNativeApiClients';
import { getNativeTrades } from '../../services/tradeApi';

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
