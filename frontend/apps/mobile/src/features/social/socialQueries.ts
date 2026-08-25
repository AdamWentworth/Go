import { useQuery } from '@tanstack/react-query';
import { getNativeTrainerProfile } from '../../services/socialApi';
import { useNativeApiClients } from '../../services/useNativeApiClients';

export const nativeSocialQueryKeys = {
  root: ['native', 'social'] as const,
  profile: (viewerId: string, username?: string | null) => [
    ...nativeSocialQueryKeys.root,
    viewerId,
    'profile',
    username?.trim().toLocaleLowerCase() || 'self',
  ] as const,
};

export const useNativeTrainerProfileQuery = (
  viewerId: string | null,
  username?: string | null,
) => {
  const clients = useNativeApiClients();
  return useQuery({
    queryKey: nativeSocialQueryKeys.profile(viewerId ?? 'signed-out', username),
    queryFn: () => getNativeTrainerProfile(clients.users, username),
    enabled: Boolean(viewerId),
    staleTime: username ? 30_000 : 60_000,
  });
};
