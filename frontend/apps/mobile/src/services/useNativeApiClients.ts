import { useMemo } from 'react';
import { useNativeSession } from '../auth/NativeSessionContext';
import {
  createNativePokemonApiClient,
  createNativeReceiverApiClient,
  createNativeSearchApiClient,
  createNativeUsersApiClient,
} from './nativeApiClients';

export const useNativeApiClients = () => {
  const session = useNativeSession();
  return useMemo(() => {
    const tokens = {
      getAccessToken: session.getAccessToken,
      refreshAccessToken: session.refreshAccessToken,
      clearSession: session.clearSession,
    };
    return {
      users: createNativeUsersApiClient(tokens),
      receiver: createNativeReceiverApiClient(tokens),
      pokemon: createNativePokemonApiClient(),
      search: createNativeSearchApiClient(tokens),
    };
  }, [session.clearSession, session.getAccessToken, session.refreshAccessToken]);
};
