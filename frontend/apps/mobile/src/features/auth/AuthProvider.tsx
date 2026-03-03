import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import type { LoginResponse } from '@pokemongonexus/shared-contracts/auth';
import {
  loginUser,
  logoutUser,
  refreshSession,
  type LoginRequest,
} from '../../services/authService';
import { HttpError } from '../../services/httpClient';
import {
  clearStoredSession,
  loadStoredSession,
  saveStoredSession,
} from './sessionStorage';
import {
  clearAuthToken,
  setAuthToken,
} from './authSession';

type SessionStatus = 'bootstrapping' | 'authenticated' | 'unauthenticated';

type AuthContextValue = {
  status: SessionStatus;
  user: LoginResponse | null;
  error: string | null;
  signIn: (credentials: LoginRequest) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (nextUser: LoginResponse) => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const toErrorMessage = (error: unknown): string => {
  if (error instanceof HttpError) {
    return error.data.message || `Request failed (${error.status})`;
  }
  if (error instanceof Error) return error.message;
  return 'Unknown authentication error';
};

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [status, setStatus] = useState<SessionStatus>('bootstrapping');
  const [user, setUser] = useState<LoginResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        const persistedSession = await loadStoredSession();
        if (!isMounted) return;

        if (persistedSession) {
          setUser(persistedSession);
          setAuthToken(persistedSession.token);
          setStatus('authenticated');
        } else {
          clearAuthToken();
          setStatus('unauthenticated');
        }

        void refreshSession().catch(() => {
          // Keep local persisted session until explicit logout.
        });
      } catch {
        if (isMounted) {
          setUser(null);
          setStatus('unauthenticated');
        }
      }
    };

    void bootstrap();
    return () => {
      isMounted = false;
    };
  }, []);

  const signIn = useCallback(async (credentials: LoginRequest) => {
    setError(null);
    try {
      const response = await loginUser(credentials);
      await saveStoredSession(response);
      setAuthToken(response.token);
      setUser(response);
      setStatus('authenticated');
    } catch (nextError) {
      setStatus('unauthenticated');
      setError(toErrorMessage(nextError));
      throw nextError;
    }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    try {
      await logoutUser();
    } catch {
      // Logout failures should still clear local auth state.
    } finally {
      await clearStoredSession();
      clearAuthToken();
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  const updateUser = useCallback(async (nextUser: LoginResponse) => {
    await saveStoredSession(nextUser);
    setAuthToken(nextUser.token);
    setUser(nextUser);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      error,
      signIn,
      signOut,
      updateUser,
      clearError,
    }),
    [status, user, error, signIn, signOut, updateUser, clearError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
