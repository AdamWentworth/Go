import type { Coordinates } from './location';

export const authContract = {
  endpoints: {
    register: '/register',
    login: '/login',
    logout: '/logout',
    refresh: '/refresh',
    resetPassword: '/reset-password',
    googleStart: '/google',
    googlePending: '/google/pending',
    googleCompleteRegistration: '/google/complete-registration',
    discordStart: '/discord',
    discordPending: '/discord/pending',
    discordCompleteRegistration: '/discord/complete-registration',
    facebookStart: '/facebook',
    facebookPending: '/facebook/pending',
    facebookCompleteRegistration: '/facebook/complete-registration',
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

export type OAuthSessionResponse = AuthUser;

export interface ResetPasswordRequest {
  identifier: string;
}

export type AuthRequestPayload = Record<string, unknown>;
