import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { searchNativeTrainers } from '../../services/trainerSearchApi';
import { useNativeApiClients } from '../../services/useNativeApiClients';

export const nativeSearchQueryKeys = {
  root: ['native', 'search'] as const,
  trainers: (query: string) => [
    ...nativeSearchQueryKeys.root,
    'trainers',
    query.trim().toLocaleLowerCase(),
  ] as const,
};

export const useNativeTrainerSearchQuery = (
  query: string,
  enabled: boolean,
) => {
  const clients = useNativeApiClients();
  const normalized = query.trim();
  return useQuery({
    queryKey: nativeSearchQueryKeys.trainers(normalized),
    queryFn: () => searchNativeTrainers(clients.users, normalized),
    enabled: enabled && normalized.length >= 2,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
};
