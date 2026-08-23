import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNativeApiClients } from '../../services/useNativeApiClients';
import { nativeCollectionOutbox } from '../../storage/nativeCollectionOutbox';
import type { NativeCollectionSnapshot } from '../../services/collectionApi';
import { nativeCollectionQueryKeys } from './collectionQueries';
import { persistNativeFavoriteMutation } from './nativeFavoriteMutation';

export const useNativeFavoriteMutation = (
  userId: string,
  requestedInstanceId: string,
) => {
  const clients = useNativeApiClients();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (favorite: boolean) => {
      const queryKey = nativeCollectionQueryKeys.snapshot(userId);
      const snapshot = queryClient.getQueryData<NativeCollectionSnapshot>(queryKey);
      if (!snapshot) throw new Error('Load your collection before changing this Pokémon.');
      const result = await persistNativeFavoriteMutation({
        userId,
        snapshot,
        requestedInstanceId,
        favorite,
        outbox: nativeCollectionOutbox,
        receiverClient: clients.receiver,
        onQueued: (mutation) => {
          queryClient.setQueryData<NativeCollectionSnapshot>(queryKey, (current) => {
            if (!current) return current;
            return {
              ...current,
              instances: {
                ...current.instances,
                [mutation.collectionKey]: mutation.updated,
              },
            };
          });
        },
      });
      await queryClient.invalidateQueries({ queryKey });
      return result;
    },
  });
};
