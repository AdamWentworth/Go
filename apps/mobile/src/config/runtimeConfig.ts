import Constants from 'expo-constants';

type RuntimeApiConfig = {
  authApiUrl: string;
  usersApiUrl: string;
  searchApiUrl: string;
  pokemonApiUrl: string;
  locationApiUrl: string;
  eventsApiUrl: string;
};

type ExpoExtra = {
  api?: Partial<RuntimeApiConfig>;
};

const DEFAULT_API_CONFIG: RuntimeApiConfig = {
  authApiUrl: 'https://pokemongonexus.com/api/auth',
  usersApiUrl: 'https://pokemongonexus.com/api/users',
  searchApiUrl: 'https://pokemongonexus.com/api/search',
  pokemonApiUrl: 'https://pokemongonexus.com/api/pokemon',
  locationApiUrl: 'https://pokemongonexus.com/api/location',
  eventsApiUrl: 'https://pokemongonexus.com/api/events',
};

const sanitizeUrl = (value: unknown, fallback: string): string => {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

const readExtra = (): Partial<RuntimeApiConfig> => {
  const fromExpoConfig = (Constants.expoConfig?.extra ?? {}) as ExpoExtra;
  return fromExpoConfig.api ?? {};
};

const apiOverrides = readExtra();

export const runtimeConfig: { api: RuntimeApiConfig } = {
  api: {
    authApiUrl: sanitizeUrl(apiOverrides.authApiUrl, DEFAULT_API_CONFIG.authApiUrl),
    usersApiUrl: sanitizeUrl(apiOverrides.usersApiUrl, DEFAULT_API_CONFIG.usersApiUrl),
    searchApiUrl: sanitizeUrl(apiOverrides.searchApiUrl, DEFAULT_API_CONFIG.searchApiUrl),
    pokemonApiUrl: sanitizeUrl(apiOverrides.pokemonApiUrl, DEFAULT_API_CONFIG.pokemonApiUrl),
    locationApiUrl: sanitizeUrl(apiOverrides.locationApiUrl, DEFAULT_API_CONFIG.locationApiUrl),
    eventsApiUrl: sanitizeUrl(apiOverrides.eventsApiUrl, DEFAULT_API_CONFIG.eventsApiUrl),
  },
};
