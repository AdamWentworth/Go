// auth.ts

import type { Coordinates } from './location';
import type { Instances } from './instances';

export interface User {
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

export interface RefreshTokenPayload {
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
  accessToken: string;
}

export interface GenericPayload {
  [key: string]: unknown;
}

export interface LoginFormValues extends GenericPayload {
  username: string;
  password: string;
}

export interface RegisterFormValues extends GenericPayload {
  username: string;
  email: string;
  password: string;
  trainerCode: string;
  pokemonGoName: string;
  locationInput: string;
  coordinates: Coordinates | null;
  allowLocation: boolean;
  pokemonGoNameDisabled: boolean;
}

export interface RegisterFormErrors {
  [key: string]: string;
}

export interface LoginResponse {
  email: string;
  username: string;
  pokemonGoName: string;
  trainerCode: string;
  user_id: string;
  token: string;
  allowLocation: boolean;
  location: string;
  coordinates: Coordinates | null;
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
}

export interface OwnershipResponse {
  pokemon_instances: Instances;
  trades: unknown[];
  related_instances: unknown[];
}

export interface AccountFormValues {
  userId: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  pokemonGoName: string;
  pokemonGoNameDisabled: boolean;
  trainerCode: string;
  allowLocation: boolean;
  location: string;
  coordinates: Coordinates | null;
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
}

export interface FormErrors {
  [key: string]: string;
}
