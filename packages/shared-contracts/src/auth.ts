import type { Coordinates } from './location';

export const authContract = {
  endpoints: {
    register: '/register',
    login: '/login',
    logout: '/logout',
    refresh: '/refresh',
    resetPassword: '/reset-password',
    updateUser: (userId: string) => `/update/${encodeURIComponent(userId)}`,
    deleteUser: (userId: string) => `/delete/${encodeURIComponent(userId)}`,
  },
} as const;

export interface AuthUser {
  user_id: string;
  username: string;
  email: string;
  pokemonGoName: string;
  trainerCode: string;
  location: string;
  allowLocation: boolean;
  coordinates?: Coordinates | null;
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
  [key: string]: unknown;
}

export interface LoginResponse extends AuthUser {
  token: string;
  coordinates: Coordinates | null;
}

export interface RefreshTokenResponse {
  accessToken: string;
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
}

export interface ResetPasswordRequest {
  identifier: string;
}

export type AuthRequestPayload = Record<string, unknown>;
