// UserSearchContext.js

import React, { createContext, useState } from 'react';

const UserSearchContext = createContext();
const EVENTS_API_URL = process.env.REACT_APP_EVENTS_API_URL;
const CACHE_NAME = 'SearchCache';
const CACHE_PREFIX = '';

export function UserSearchProvider({ children }) {
  const [viewedOwnershipData, setViewedOwnershipData] = useState(null);
  const [userExists, setUserExists] = useState(null); // null indicates loading
  const [viewedLoading, setViewedLoading] = useState(false);

  // Function to fetch user ownership data
  const fetchUserOwnershipData = async (
    searchedUsername,
    setOwnershipFilter,
    setShowAll,
    defaultFilter = 'Owned'
  ) => {
    // Reset states before fetching new data
    setViewedLoading(true);
    setUserExists(null);

    try {
      const cache = await caches.open(CACHE_NAME);
      const cacheKey = CACHE_PREFIX + searchedUsername;
      const cachedResponse = await cache.match(cacheKey);

      if (cachedResponse) {
        const cachedData = await cachedResponse.json();
        const now = Date.now();
        const cacheAge = now - (cachedData.timestamp || 0);

        // If cache is younger than 1 hour (3600000 ms), use it
        if (cacheAge < 3600000) {
          setViewedOwnershipData(cachedData.ownershipData);
          setUserExists(true);
          if (setOwnershipFilter) setOwnershipFilter(defaultFilter);
          if (setShowAll) setShowAll(true);
          return;
        } else {
          // Cache is old, delete it
          await cache.delete(cacheKey);
        }
      }

      // Fetch from API if no cache or cache is expired
      const response = await fetch(
        `${EVENTS_API_URL}/ownershipData/username/${searchedUsername}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      if (response.ok) {
        const data = await response.json();
        setViewedOwnershipData(data);
        setUserExists(true);
        if (setOwnershipFilter) setOwnershipFilter(defaultFilter);
        if (setShowAll) setShowAll(true);

        const cacheResponse = new Response(
          JSON.stringify({
            username: searchedUsername,
            ownershipData: data,
            timestamp: Date.now(),
          })
        );
        await cache.put(cacheKey, cacheResponse);
      } else if (response.status === 404) {
        // User not found
        setUserExists(false);
        setViewedOwnershipData(null);
      } else {
        // Other errors
        console.error('Error fetching user data:', response.statusText);
        setViewedOwnershipData(null);
      }
    } catch (error) {
      console.error(`Fetch error for username ${searchedUsername}:`, error);
      setViewedOwnershipData(null);
    } finally {
      setViewedLoading(false);
    }
  };

  return (
    <UserSearchContext.Provider
      value={{
        viewedOwnershipData,
        userExists,
        viewedLoading,
        fetchUserOwnershipData,
        setUserExists, // Expose setter
        setViewedOwnershipData, // Expose setter
      }}
    >
      {children}
    </UserSearchContext.Provider>
  );
}

export default UserSearchContext;
