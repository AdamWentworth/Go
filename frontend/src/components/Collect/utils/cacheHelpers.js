// cacheHelpers.js

// Utility function to check if cached data is fresh
export const isDataFresh = (timestamp, maxAgeHours = 24) => {
    return Date.now() - timestamp < maxAgeHours * 60 * 60 * 1000;
};