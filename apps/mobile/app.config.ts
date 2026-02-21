import type { ConfigContext, ExpoConfig } from 'expo/config';

const readEnv = (name: string, fallback: string): string =>
  process.env[name]?.trim() || fallback;

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
    },
  },
});
