import * as SecureStore from 'expo-secure-store';
import type { LoginResponse } from '@pokemongonexus/shared-contracts/auth';

const AUTH_SESSION_KEY = 'pgn_mobile_auth_session_v1';

const isLoginResponse = (value: unknown): value is LoginResponse => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<LoginResponse>;
  return (
    typeof candidate.user_id === 'string' &&
    typeof candidate.username === 'string' &&
    typeof candidate.token === 'string'
  );
};

export const loadStoredSession = async (): Promise<LoginResponse | null> => {
  try {
    const raw = await SecureStore.getItemAsync(AUTH_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return isLoginResponse(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const saveStoredSession = async (session: LoginResponse): Promise<void> => {
  await SecureStore.setItemAsync(AUTH_SESSION_KEY, JSON.stringify(session));
};

export const clearStoredSession = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(AUTH_SESSION_KEY);
};
