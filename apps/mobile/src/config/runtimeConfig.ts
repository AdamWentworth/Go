import Constants from 'expo-constants';

type RuntimeApiConfig = {
  authApiUrl: string;
  usersApiUrl: string;
  searchApiUrl: string;
  pokemonApiUrl: string;
  locationApiUrl: string;
  eventsApiUrl: string;
  receiverApiUrl: string;
};

type RuntimeObservabilityConfig = {
  crashReportUrl: string | null;
  crashReportApiKey: string | null;
  appEnv: string;
  appRelease: string;
};

type RuntimeRealtimeConfig = {
  allowAccessTokenQueryFallback: boolean;
};

type ExpoExtra = {
  api?: Partial<RuntimeApiConfig>;
  observability?: Partial<RuntimeObservabilityConfig>;
  realtime?: Partial<RuntimeRealtimeConfig>;
};

const DEFAULT_API_CONFIG: RuntimeApiConfig = {
  authApiUrl: 'https://pokemongonexus.com/api/auth',
  usersApiUrl: 'https://pokemongonexus.com/api/users',
  searchApiUrl: 'https://pokemongonexus.com/api/search',
  pokemonApiUrl: 'https://pokemongonexus.com/api/pokemon',
  locationApiUrl: 'https://pokemongonexus.com/api/location',
  eventsApiUrl: 'https://pokemongonexus.com/api/events',
  receiverApiUrl: 'https://pokemongonexus.com/api/receiver',
};

const DEFAULT_OBSERVABILITY_CONFIG: RuntimeObservabilityConfig = {
  crashReportUrl: null,
  crashReportApiKey: null,
  appEnv: __DEV__ ? 'development' : 'production',
  appRelease: 'mobile@1.0.0',
};

const DEFAULT_REALTIME_CONFIG: RuntimeRealtimeConfig = {
  allowAccessTokenQueryFallback: false,
};

const sanitizeUrl = (value: unknown, fallback: string): string => {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

const sanitizeOptionalUrl = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const sanitizeOptionalString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const sanitizeString = (value: unknown, fallback: string): string => {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

const sanitizeBoolean = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true;
  if (normalized === 'false' || normalized === '0' || normalized === 'no') return false;
  return fallback;
};

const readExtra = (): ExpoExtra => {
  const fromExpoConfig = (Constants.expoConfig?.extra ?? {}) as ExpoExtra;
  return fromExpoConfig;
};

const extra = readExtra();
const apiOverrides = extra.api ?? {};
const observabilityOverrides = extra.observability ?? {};
const realtimeOverrides = extra.realtime ?? {};

export const runtimeConfig: {
  api: RuntimeApiConfig;
  observability: RuntimeObservabilityConfig;
  realtime: RuntimeRealtimeConfig;
} = {
  api: {
    authApiUrl: sanitizeUrl(apiOverrides.authApiUrl, DEFAULT_API_CONFIG.authApiUrl),
    usersApiUrl: sanitizeUrl(apiOverrides.usersApiUrl, DEFAULT_API_CONFIG.usersApiUrl),
    searchApiUrl: sanitizeUrl(apiOverrides.searchApiUrl, DEFAULT_API_CONFIG.searchApiUrl),
    pokemonApiUrl: sanitizeUrl(apiOverrides.pokemonApiUrl, DEFAULT_API_CONFIG.pokemonApiUrl),
    locationApiUrl: sanitizeUrl(apiOverrides.locationApiUrl, DEFAULT_API_CONFIG.locationApiUrl),
    eventsApiUrl: sanitizeUrl(apiOverrides.eventsApiUrl, DEFAULT_API_CONFIG.eventsApiUrl),
    receiverApiUrl: sanitizeUrl(apiOverrides.receiverApiUrl, DEFAULT_API_CONFIG.receiverApiUrl),
  },
  observability: {
    crashReportUrl:
      sanitizeOptionalUrl(observabilityOverrides.crashReportUrl) ??
      DEFAULT_OBSERVABILITY_CONFIG.crashReportUrl,
    crashReportApiKey:
      sanitizeOptionalString(observabilityOverrides.crashReportApiKey) ??
      DEFAULT_OBSERVABILITY_CONFIG.crashReportApiKey,
    appEnv: sanitizeString(observabilityOverrides.appEnv, DEFAULT_OBSERVABILITY_CONFIG.appEnv),
    appRelease: sanitizeString(
      observabilityOverrides.appRelease,
      DEFAULT_OBSERVABILITY_CONFIG.appRelease,
    ),
  },
  realtime: {
    allowAccessTokenQueryFallback: sanitizeBoolean(
      realtimeOverrides.allowAccessTokenQueryFallback,
      DEFAULT_REALTIME_CONFIG.allowAccessTokenQueryFallback,
    ),
  },
};
