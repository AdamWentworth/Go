import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  acceptNativeFriendRequest,
  blockNativeTrainer,
  deleteNativeFriendRequest,
  getNativeTrainerProfile,
  removeNativeFriend,
  sendNativeFriendRequest,
} from '../../services/socialApi';
import { useNativeApiClients } from '../../services/useNativeApiClients';

export const nativeSocialQueryKeys = {
  root: ['native', 'social'] as const,
  profile: (viewerId: string, username?: string | null) => [
    ...nativeSocialQueryKeys.root,
    viewerId,
    'profile',
    username?.trim().toLocaleLowerCase() || 'self',
  ] as const,
  friends: (viewerId: string) => [...nativeSocialQueryKeys.root, viewerId, 'friends'] as const,
};

export type NativeProfileRelationshipCommand =
  | { action: 'add'; username: string }
  | { action: 'accept'; friendshipId: string }
  | { action: 'cancel-request'; friendshipId: string }
  | { action: 'remove-friend'; userId: string }
  | { action: 'block'; userId: string };

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

export const useNativeProfileRelationshipMutation = (
  viewerId: string,
  username: string,
) => {
  const clients = useNativeApiClients();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (command: NativeProfileRelationshipCommand) => {
      switch (command.action) {
        case 'add':
          await sendNativeFriendRequest(clients.users, command.username);
          return 'Friend request sent.';
        case 'accept':
          await acceptNativeFriendRequest(clients.users, command.friendshipId);
          return 'Friend request accepted.';
        case 'cancel-request':
          await deleteNativeFriendRequest(clients.users, command.friendshipId);
          return 'Friend request canceled.';
        case 'remove-friend':
          await removeNativeFriend(clients.users, command.userId);
          return 'Friend removed.';
        case 'block':
          await blockNativeTrainer(clients.users, command.userId);
          return 'Trainer blocked.';
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: nativeSocialQueryKeys.profile(viewerId, username) });
      void queryClient.invalidateQueries({ queryKey: nativeSocialQueryKeys.friends(viewerId) });
    },
  });
};
