import { useMemo } from 'react';
import { useNativeSession } from '../auth/NativeSessionContext';
import {
  createNativePokemonApiClient,
  createNativeUsersApiClient,
} from './nativeApiClients';

export const useNativeApiClients = () => {
  const session = useNativeSession();
  return useMemo(() => ({
    users: createNativeUsersApiClient({
      getAccessToken: session.getAccessToken,
      refreshAccessToken: session.refreshAccessToken,
      clearSession: session.clearSession,
    }),
    pokemon: createNativePokemonApiClient(),
  }), [session.clearSession, session.getAccessToken, session.refreshAccessToken]);
};
