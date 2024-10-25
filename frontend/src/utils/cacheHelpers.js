// cacheHelpers.js

// Utility function to check if cached data is fresh
export const isDataFresh = (timestamp, maxAgeHours = 24) => {
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