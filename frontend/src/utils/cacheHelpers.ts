// utils/cacheHelpers.ts

/**
 * Determines if a timestamp is still considered fresh.
 *
 * @param timestamp - The timestamp to check.
 * @param maxAgeHours - The maximum age (in hours) considered fresh.
 * @returns True if fresh, false otherwise.
 */
export const isDataFresh = (timestamp: number, maxAgeHours = 24): boolean => {
  const forcedRefreshCutoff = parseInt(import.meta.env.VITE_FORCED_REFRESH_TIMESTAMP || '0', 10);

  if (!timestamp || (forcedRefreshCutoff && timestamp < forcedRefreshCutoff)) {
    return false;
  }

  return Date.now() - timestamp < maxAgeHours * 60 * 60 * 1000;
};

/**
 * Attempts to read a timestamp value from a cache named "pokemonCache".
 *
 * @returns The cached timestamp if available, otherwise null.
 */
export const readTimestampFromCache = async (): Promise<number | null> => {
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cache = await caches.open('pokemonCache');
      const cachedResponse = await cache.match('/pokemonOwnership');

      if (cachedResponse) {
        const cachedData = await cachedResponse.json();
        return cachedData.timestamp ?? null;
      }
    } catch (error) {
      console.error('Error reading timestamp from cache:', error);
    }
  }

  return null;
};
