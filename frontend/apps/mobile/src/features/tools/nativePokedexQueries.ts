import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NativePokedexManualRegistration } from './nativePokedexModel';
import { nativePokedexRegistrationStore } from '../../storage/nativePokedexRegistrations';

export const nativePokedexQueryKeys = {
  registrations: (userId: string) => ['native', 'pokedex', userId, 'registrations'] as const,
};

export const useNativePokedexRegistrationsQuery = (userId: string | null) => useQuery({
  queryKey: nativePokedexQueryKeys.registrations(userId ?? 'signed-out'),
  queryFn: () => nativePokedexRegistrationStore.read(userId ?? ''),
  enabled: Boolean(userId),
  staleTime: Number.POSITIVE_INFINITY,
});

export const useNativePokedexRegistrationMutation = (userId: string | null) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ registrations, registered }: { registrations: NativePokedexManualRegistration[]; registered: boolean }) => {
      if (!userId) throw new Error('Sign in to change Pokédex registrations.');
      if (registered) await nativePokedexRegistrationStore.register(userId, registrations);
      else await nativePokedexRegistrationStore.unregister(userId, registrations.map(({ registrationId }) => registrationId));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: nativePokedexQueryKeys.registrations(userId ?? 'signed-out') }),
  });
};
