/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_POKEMON_API_URL: string;
  readonly VITE_AUTH_API_URL: string;
  readonly VITE_RECEIVER_API_URL: string;
  readonly VITE_USERS_API_URL: string;
  readonly VITE_SEARCH_API_URL: string;
  readonly VITE_LOCATION_SERVICE_URL: string;
  readonly VITE_EVENTS_API_URL: string;

  readonly VITE_FORCED_REFRESH_TIMESTAMP?: string;
  readonly VITE_SHOW_PERF_PANEL?: string;
  readonly VITE_LOG_WARNINGS?: string;
  readonly VITE_LOG_LEVEL?: 'debug' | 'info' | 'warn' | 'error' | 'silent';
  readonly VITE_VERBOSE_LOGS?: string;
  readonly VITE_DEBUG_LOGS?: string; // legacy compatibility
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  let TextEncoder: typeof TextEncoder;
  let TextDecoder: typeof TextDecoder;
  let TransformStream: typeof TransformStream;
  let BroadcastChannel: typeof BroadcastChannel;
}
