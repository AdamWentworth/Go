import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';
import {
  nativeSocialQueryKeys,
  useNativeFriendsMutation,
  useNativeFriendsQuery,
  useNativeProfileRelationshipMutation,
} from '../../../../src/features/social/socialQueries';
import {
  acceptNativeFriendRequest,
  blockNativeTrainer,
  deleteNativeFriendRequest,
  getNativeFriendsOverview,
  removeNativeFriend,
  sendNativeFriendRequest,
  unblockNativeTrainer,
} from '../../../../src/services/socialApi';

jest.mock('../../../../src/services/useNativeApiClients', () => ({
  useNativeApiClients: () => ({ users: { kind: 'users-client' } }),
}));

jest.mock('../../../../src/services/socialApi', () => ({
  acceptNativeFriendRequest: jest.fn().mockResolvedValue(undefined),
  blockNativeTrainer: jest.fn().mockResolvedValue(undefined),
  deleteNativeFriendRequest: jest.fn().mockResolvedValue(undefined),
  getNativeFriendsOverview: jest.fn(),
  getNativeTrainerProfile: jest.fn(),
  removeNativeFriend: jest.fn().mockResolvedValue(undefined),
  sendNativeFriendRequest: jest.fn().mockResolvedValue('friendship-1'),
  unblockNativeTrainer: jest.fn().mockResolvedValue(undefined),
}));

const makeWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Number.POSITIVE_INFINITY },
      mutations: { retry: false, gcTime: Number.POSITIVE_INFINITY },
    },
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
};

describe('native friends queries', () => {
  beforeEach(() => jest.clearAllMocks());

  it('loads friends only for a signed-in viewer', async () => {
    const overview = { friends: [], incoming: [], outgoing: [], blocked: [] };
    jest.mocked(getNativeFriendsOverview).mockResolvedValue(overview);
    const { queryClient, wrapper } = makeWrapper();
    const signedOut = renderHook(() => useNativeFriendsQuery(null), { wrapper });
    expect(signedOut.result.current.fetchStatus).toBe('idle');
    signedOut.unmount();

    const signedIn = renderHook(() => useNativeFriendsQuery('viewer-1'), { wrapper });
    await act(async () => {
      await signedIn.result.current.refetch();
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    });
    expect(getNativeFriendsOverview).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'users-client' }),
    );
    queryClient.clear();
  });

  it('dispatches every friends-hub command and invalidates the overview', async () => {
    const { queryClient, wrapper } = makeWrapper();
    const invalidate = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue(undefined);
    const { result } = renderHook(() => useNativeFriendsMutation('viewer-1'), { wrapper });
    const run = async (command: Parameters<typeof result.current.mutateAsync>[0]) => act(async () => {
      const message = await result.current.mutateAsync(command);
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      return message;
    });

    await expect(run({ action: 'add', username: 'Misty' })).resolves.toBe('Friend request sent.');
    await expect(run({ action: 'accept', friendshipId: 'friendship-1' })).resolves.toBe('Friend request accepted.');
    await expect(run({ action: 'delete-request', friendshipId: 'friendship-1', message: 'Request declined.' })).resolves.toBe('Request declined.');
    await expect(run({ action: 'remove-friend', userId: 'user-2' })).resolves.toBe('Friend removed.');
    await expect(run({ action: 'unblock', userId: 'user-2' })).resolves.toBe('Trainer unblocked.');

    const client = expect.objectContaining({ kind: 'users-client' });
    expect(sendNativeFriendRequest).toHaveBeenCalledWith(client, 'Misty');
    expect(acceptNativeFriendRequest).toHaveBeenCalledWith(client, 'friendship-1');
    expect(deleteNativeFriendRequest).toHaveBeenCalledWith(client, 'friendship-1');
    expect(removeNativeFriend).toHaveBeenCalledWith(client, 'user-2');
    expect(unblockNativeTrainer).toHaveBeenCalledWith(client, 'user-2');
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: nativeSocialQueryKeys.friends('viewer-1'),
    });
    queryClient.clear();
  });
});

describe('useNativeProfileRelationshipMutation', () => {
  beforeEach(() => jest.clearAllMocks());
  it('dispatches each authoritative command and refreshes profile and friends state', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: Number.POSITIVE_INFINITY },
        mutations: { retry: false, gcTime: Number.POSITIVE_INFINITY },
      },
    });
    const invalidate = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue(undefined);
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(
      () => useNativeProfileRelationshipMutation('viewer-1', 'Misty'),
      { wrapper },
    );

    const run = async (
      command: Parameters<typeof result.current.mutateAsync>[0],
    ) => act(async () => {
      const message = await result.current.mutateAsync(command);
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      return message;
    });
    await expect(run({ action: 'add', username: 'Misty' })).resolves.toBe('Friend request sent.');
    await run({ action: 'accept', friendshipId: 'friendship-1' });
    await run({ action: 'cancel-request', friendshipId: 'friendship-1' });
    await run({ action: 'remove-friend', userId: 'user-2' });
    await run({ action: 'block', userId: 'user-2' });

    const client = expect.objectContaining({ kind: 'users-client' });
    expect(sendNativeFriendRequest).toHaveBeenCalledWith(client, 'Misty');
    expect(acceptNativeFriendRequest).toHaveBeenCalledWith(client, 'friendship-1');
    expect(deleteNativeFriendRequest).toHaveBeenCalledWith(client, 'friendship-1');
    expect(removeNativeFriend).toHaveBeenCalledWith(client, 'user-2');
    expect(blockNativeTrainer).toHaveBeenCalledWith(client, 'user-2');
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: nativeSocialQueryKeys.profile('viewer-1', 'Misty'),
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: nativeSocialQueryKeys.friends('viewer-1'),
    });
    queryClient.clear();
  });
});
