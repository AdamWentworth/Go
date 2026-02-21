import type { LoginResponse } from '@pokemongonexus/shared-contracts/auth';
import * as SecureStore from 'expo-secure-store';
import {
  clearStoredSession,
  loadStoredSession,
  saveStoredSession,
} from '../../../../src/features/auth/sessionStorage';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const mockSession: LoginResponse = {
  user_id: 'u1',
  username: 'ash',
  email: 'ash@example.com',
  pokemonGoName: 'Ash',
  trainerCode: '123412341234',
  location: 'Pallet Town',
  allowLocation: false,
  coordinates: null,
  accessTokenExpiry: '2099-01-01T00:00:00.000Z',
  refreshTokenExpiry: '2099-01-02T00:00:00.000Z',
  token: 'jwt',
};

describe('sessionStorage', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('loads a valid stored session', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(JSON.stringify(mockSession));

    await expect(loadStoredSession()).resolves.toEqual(mockSession);
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('pgn_mobile_auth_session_v1');
  });

  it('returns null when stored payload is invalid', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('{"foo":"bar"}');
    await expect(loadStoredSession()).resolves.toBeNull();
  });

  it('saves and clears session payload', async () => {
    await saveStoredSession(mockSession);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'pgn_mobile_auth_session_v1',
      JSON.stringify(mockSession),
    );

    await clearStoredSession();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('pgn_mobile_auth_session_v1');
  });
});
