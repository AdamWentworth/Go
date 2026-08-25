import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';
import {
  nativeSocialQueryKeys,
  useNativeProfileRelationshipMutation,
} from '../../../../src/features/social/socialQueries';
import {
  acceptNativeFriendRequest,
  blockNativeTrainer,
  deleteNativeFriendRequest,
  removeNativeFriend,
  sendNativeFriendRequest,
} from '../../../../src/services/socialApi';

jest.mock('../../../../src/services/useNativeApiClients', () => ({
  useNativeApiClients: () => ({ users: { kind: 'users-client' } }),
}));

jest.mock('../../../../src/services/socialApi', () => ({
  acceptNativeFriendRequest: jest.fn().mockResolvedValue(undefined),
  blockNativeTrainer: jest.fn().mockResolvedValue(undefined),
  deleteNativeFriendRequest: jest.fn().mockResolvedValue(undefined),
  getNativeTrainerProfile: jest.fn(),
  removeNativeFriend: jest.fn().mockResolvedValue(undefined),
  sendNativeFriendRequest: jest.fn().mockResolvedValue('friendship-1'),
}));

describe('useNativeProfileRelationshipMutation', () => {
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
