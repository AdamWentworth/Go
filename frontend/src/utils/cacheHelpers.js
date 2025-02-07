// cacheHelpers.js

export const isDataFresh = (timestamp, maxAgeHours = 24) => {
  // 1. Read the forced refresh cutoff from your React environment variable
  //    (in .env: REACT_APP_FORCED_REFRESH_TIMESTAMP=1692802746000)
  const forcedRefreshCutoff = parseInt(process.env.REACT_APP_FORCED_REFRESH_TIMESTAMP || '0', 10);

  // If there's no timestamp or the timestamp is older than the forced cutoff,
  // treat the data as stale.
  if (!timestamp || (forcedRefreshCutoff && timestamp < forcedRefreshCutoff)) {
    return false;
  }

  // Otherwise, fall back to the existing freshness check (e.g., < maxAgeHours)
  return Date.now() - timestamp < maxAgeHours * 60 * 60 * 1000;
};


export const readTimestampFromCache = async () => {
    if ('caches' in window) {
      try {
        const cache = await caches.open('pokemonCache');
        const cachedResponse = await cache.match('/pokemonOwnership');
        if (cachedResponse) {
          const cachedData = await cachedResponse.json();
          return cachedData.timestamp; // Assuming your cached data has a 'timestamp' field
        }
      } catch (error) {
        console.error('Error reading timestamp from cache:', error);
      }
    }
    return null;
  };