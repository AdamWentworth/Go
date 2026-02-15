// vite-env.d.ts

/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_FORCED_REFRESH_TIMESTAMP?: string;
    readonly VITE_LOG_LEVEL?: 'debug' | 'info' | 'warn' | 'error' | 'silent';
    readonly VITE_VERBOSE_LOGS?: string;
    readonly VITE_DEBUG_LOGS?: string;
    // Add other custom VITE_ variables here
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
  
