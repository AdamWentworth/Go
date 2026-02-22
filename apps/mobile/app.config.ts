import type { ConfigContext, ExpoConfig } from 'expo/config';

const readEnv = (name: string, fallback: string): string =>
  process.env[name]?.trim() || fallback;
const readBool = (name: string, fallback: boolean): boolean => {
  const value = process.env[name]?.trim().toLowerCase();
  if (!value) return fallback;
  if (value === 'true' || value === '1' || value === 'yes') return true;
  if (value === 'false' || value === '0' || value === 'no') return false;
  return fallback;
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'mobile',
  slug: config.slug ?? 'mobile',
  version: config.version ?? '1.0.0',
  extra: {
    ...config.extra,
    api: {
      authApiUrl: readEnv('EXPO_PUBLIC_AUTH_API_URL', 'https://pokemongonexus.com/api/auth'),
      usersApiUrl: readEnv('EXPO_PUBLIC_USERS_API_URL', 'https://pokemongonexus.com/api/users'),
      searchApiUrl: readEnv('EXPO_PUBLIC_SEARCH_API_URL', 'https://pokemongonexus.com/api/search'),
      pokemonApiUrl: readEnv('EXPO_PUBLIC_POKEMON_API_URL', 'https://pokemongonexus.com/api/pokemon'),
      locationApiUrl: readEnv('EXPO_PUBLIC_LOCATION_API_URL', 'https://pokemongonexus.com/api/location'),
      eventsApiUrl: readEnv('EXPO_PUBLIC_EVENTS_API_URL', 'https://pokemongonexus.com/api/events'),
      receiverApiUrl: readEnv('EXPO_PUBLIC_RECEIVER_API_URL', 'https://pokemongonexus.com/api/receiver'),
    },
    observability: {
      crashReportUrl: readEnv('EXPO_PUBLIC_CRASH_REPORT_URL', ''),
      crashReportApiKey: readEnv('EXPO_PUBLIC_CRASH_REPORT_API_KEY', ''),
      appEnv: readEnv('EXPO_PUBLIC_APP_ENV', 'development'),
      appRelease: readEnv('EXPO_PUBLIC_APP_RELEASE', config.version ?? 'mobile@1.0.0'),
    },
    realtime: {
      allowAccessTokenQueryFallback: readBool('EXPO_PUBLIC_REALTIME_ALLOW_QUERY_TOKEN', false),
    },
  },
});
