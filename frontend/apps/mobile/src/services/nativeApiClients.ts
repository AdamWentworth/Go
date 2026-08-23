import {
  createApiClient,
  type AccessTokenProvider,
} from '@pokemongonexus/shared-api-client';
import { runtimeConfig } from '../config/runtimeConfig';

export const createNativeUsersApiClient = (
  tokens: AccessTokenProvider,
  fetchImplementation: typeof globalThis.fetch = globalThis.fetch,
) => createApiClient({
  baseUrl: runtimeConfig.api.usersApiUrl,
  authentication: { mode: 'bearer', tokens },
  fetch: fetchImplementation,
});

export type NativeUsersApiClient = ReturnType<typeof createNativeUsersApiClient>;

export const createNativeReceiverApiClient = (
  tokens: AccessTokenProvider,
  fetchImplementation: typeof globalThis.fetch = globalThis.fetch,
) => createApiClient({
  baseUrl: runtimeConfig.api.receiverApiUrl,
  authentication: { mode: 'bearer', tokens },
  fetch: fetchImplementation,
});

export type NativeReceiverApiClient = ReturnType<typeof createNativeReceiverApiClient>;

export const createNativePokemonApiClient = (
  fetchImplementation: typeof globalThis.fetch = globalThis.fetch,
) => createApiClient({
  baseUrl: runtimeConfig.api.pokemonApiUrl,
  authentication: { mode: 'none' },
  fetch: fetchImplementation,
});

export type NativePokemonApiClient = ReturnType<typeof createNativePokemonApiClient>;
