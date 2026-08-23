import { act, renderHook, waitFor } from '@testing-library/react-native';
import { ApiClientError } from '@pokemongonexus/shared-api-client';
import type { PropsWithChildren } from 'react';
import {
  NativeSessionProvider,
  useNativeSession,
} from '../../../src/auth/NativeSessionContext';

const session = (suffix: string) => ({
  user: {
    user_id: 'user-1',
    username: 'misty',
    email: 'misty@example.invalid',
    pokemonGoName: null,
    trainerCode: null,
    allowLocation: false,
    location: null,
    coordinates: null,
  },
  accessToken: `access-${suffix}`,
  refreshToken: `refresh-${suffix}`,
  accessTokenExpiry: '2026-08-23T22:00:00.000Z',
  refreshTokenExpiry: '2026-08-30T21:00:00.000Z',
});

describe('NativeSessionProvider', () => {
  it('restores and rotates a persisted session before exposing the user', async () => {
    const api = {
      login: jest.fn(),
      refresh: jest.fn().mockResolvedValue(session('rotated')),
      logout: jest.fn(),
    };
    const persistence = {
      read: jest.fn().mockResolvedValue('refresh-stored'),
      store: jest.fn().mockResolvedValue(undefined),
      clear: jest.fn().mockResolvedValue(undefined),
    };
    const wrapper = ({ children }: PropsWithChildren) => (
      <NativeSessionProvider api={api} persistence={persistence}>
        {children}
      </NativeSessionProvider>
    );

    const { result } = renderHook(() => useNativeSession(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('signed-in'));

    expect(api.refresh).toHaveBeenCalledWith('refresh-stored');
    expect(persistence.store).toHaveBeenCalledWith('refresh-rotated');
    expect(result.current.user?.username).toBe('misty');
    expect(result.current.getAccessToken()).toBe('access-rotated');
  });

  it('signs in with a stable device ID and clears both sides on logout', async () => {
    const api = {
      login: jest.fn().mockResolvedValue(session('login')),
      refresh: jest.fn(),
      logout: jest.fn().mockResolvedValue(undefined),
    };
    const persistence = {
      read: jest.fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce('refresh-login'),
      store: jest.fn().mockResolvedValue(undefined),
      clear: jest.fn().mockResolvedValue(undefined),
    };
    const getDeviceId = jest.fn().mockResolvedValue('native-device');
    const wrapper = ({ children }: PropsWithChildren) => (
      <NativeSessionProvider
        api={api}
        persistence={persistence}
        getDeviceId={getDeviceId}
      >
        {children}
      </NativeSessionProvider>
    );

    const { result } = renderHook(() => useNativeSession(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('signed-out'));

    await act(async () => result.current.signIn(' misty ', 'password'));
    expect(api.login).toHaveBeenCalledWith({
      username: 'misty',
      password: 'password',
      device_id: 'native-device',
    });
    expect(result.current.status).toBe('signed-in');

    await act(async () => result.current.signOut());
    expect(api.logout).toHaveBeenCalledWith('refresh-login');
    expect(result.current.status).toBe('signed-out');
    expect(result.current.getAccessToken()).toBeNull();
  });

  it('preserves persisted credentials on a transient restoration failure', async () => {
    const api = {
      login: jest.fn(),
      refresh: jest.fn()
        .mockRejectedValueOnce(new Error('Network request failed'))
        .mockResolvedValueOnce(session('retry')),
      logout: jest.fn(),
    };
    const persistence = {
      read: jest.fn().mockResolvedValue('refresh-stored'),
      store: jest.fn().mockResolvedValue(undefined),
      clear: jest.fn().mockResolvedValue(undefined),
    };
    const wrapper = ({ children }: PropsWithChildren) => (
      <NativeSessionProvider api={api} persistence={persistence}>
        {children}
      </NativeSessionProvider>
    );

    const { result } = renderHook(() => useNativeSession(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('unavailable'));
    expect(persistence.clear).not.toHaveBeenCalled();

    await act(async () => result.current.retrySession());
    expect(result.current.status).toBe('signed-in');
    expect(result.current.getAccessToken()).toBe('access-retry');
  });

  it('clears an invalid persisted refresh token', async () => {
    const api = {
      login: jest.fn(),
      refresh: jest.fn().mockRejectedValue(
        new ApiClientError(401, 'Invalid token', { message: 'Invalid token' }),
      ),
      logout: jest.fn(),
    };
    const persistence = {
      read: jest.fn().mockResolvedValue('refresh-invalid'),
      store: jest.fn(),
      clear: jest.fn().mockResolvedValue(undefined),
    };
    const wrapper = ({ children }: PropsWithChildren) => (
      <NativeSessionProvider api={api} persistence={persistence}>
        {children}
      </NativeSessionProvider>
    );

    const { result } = renderHook(() => useNativeSession(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('signed-out'));
    expect(persistence.clear).toHaveBeenCalledTimes(1);
  });
});
