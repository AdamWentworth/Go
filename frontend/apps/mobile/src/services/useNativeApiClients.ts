import { useMemo } from 'react';
import { useNativeSession } from '../auth/NativeSessionContext';
import {
  createNativePokemonApiClient,
  createNativeReceiverApiClient,
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
    };
  }, [session.clearSession, session.getAccessToken, session.refreshAccessToken]);
};
