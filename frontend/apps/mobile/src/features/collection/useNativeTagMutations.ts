import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  CreateCustomTagRequest,
  CustomTagParent,
  PokemonTagOrderKey,
  UpdateCustomTagRequest,
} from '@pokemongonexus/shared-contracts/users';
import {
  createNativeCustomTag,
  deleteNativeCustomTag,
  updateNativeCustomTag,
  updateNativePokemonTagOrder,
} from '../../services/nativeTagApi';
import { useNativeApiClients } from '../../services/useNativeApiClients';
import { nativeCollectionQueryKeys } from './collectionQueries';

export const useNativeTagMutations = (userId: string) => {
  const clients = useNativeApiClients();
  const queryClient = useQueryClient();
  const queryKey = nativeCollectionQueryKeys.snapshot(userId);
  const refresh = () => queryClient.invalidateQueries({ queryKey });

  const create = useMutation({
    mutationFn: (request: CreateCustomTagRequest) =>
      createNativeCustomTag(clients.users, request),
    onSuccess: refresh,
  });
  const update = useMutation({
    mutationFn: ({ tagId, request }: { tagId: string; request: UpdateCustomTagRequest }) =>
      updateNativeCustomTag(clients.users, tagId, request),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: (tagId: string) => deleteNativeCustomTag(clients.users, tagId),
    onSuccess: refresh,
  });
  const reorder = useMutation({
    mutationFn: ({ parent, tagKeys }: { parent: CustomTagParent; tagKeys: PokemonTagOrderKey[] }) =>
      updateNativePokemonTagOrder(clients.users, { parent, tag_keys: tagKeys }),
    onSuccess: refresh,
  });

  return {
    createTag: create.mutateAsync,
    updateTag: (tagId: string, request: UpdateCustomTagRequest) =>
      update.mutateAsync({ tagId, request }),
    deleteTag: remove.mutateAsync,
    saveOrder: (parent: CustomTagParent, tagKeys: PokemonTagOrderKey[]) =>
      reorder.mutateAsync({ parent, tagKeys }),
    isPending: create.isPending || update.isPending || remove.isPending || reorder.isPending,
  };
};
