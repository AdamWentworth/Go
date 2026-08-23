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
