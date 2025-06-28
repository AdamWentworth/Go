// src/features/variants/utils/cache.ts

// Central cache key definitions and TTL logic for the Variants feature
export const VARIANTS_KEY = 'variantsTimestamp';
export const POKEDEX_LISTS_KEY = 'pokedexListsTimestamp';

// Time-to-live for cache entries (in milliseconds)
export const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

/**
 * Record the current timestamp under the given key.
 */
export function setCacheTimestamp(key: string): void {
  localStorage.setItem(key, Date.now().toString());
}

/**
 * Check if the timestamp stored under `key` is still within the TTL.
 * Returns `false` if no timestamp is found or if it is too old.
 */
export function isCacheFresh(key: string): boolean {
  const raw = localStorage.getItem(key);
  if (!raw) return false;
  const ts = Number(raw);
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts < CACHE_TTL_MS;
}
