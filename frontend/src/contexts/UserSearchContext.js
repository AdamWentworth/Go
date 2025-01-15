// UserSearchContext.js

import React, { createContext, useState } from 'react';
import { openDB } from 'idb';

const UserSearchContext = createContext();
const USERS_API_URL = process.env.REACT_APP_USERS_API_URL;
const CACHE_NAME = 'SearchCache';
  
export function UserSearchProvider({ children }) {
  const [viewedOwnershipData, setViewedOwnershipData] = useState(null);
  const [userExists, setUserExists] = useState(null);
  const [viewedLoading, setViewedLoading] = useState(false);
  const [canonicalUsername, setCanonicalUsername] = useState(null);

  const fetchUserOwnershipData = async (
    searchedUsername,
    setOwnershipFilter,
    setShowAll,
    defaultFilter = 'Owned'
  ) => {
    setViewedLoading(true);
    setUserExists(null);

    try {
      const lowerCaseUsername = searchedUsername.toLowerCase();

      // Open IndexedDB
      const db = await openDB(CACHE_NAME, 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(CACHE_NAME)) {
            db.createObjectStore(CACHE_NAME, { keyPath: 'username' });
          }
        },
      });

      // Attempt to find a matching key ignoring case
      let canonicalUsername = null;
      const allKeys = await db.getAllKeys(CACHE_NAME);
      for (const key of allKeys) {
        if (typeof key === 'string' && key.toLowerCase() === lowerCaseUsername) {
          canonicalUsername = key;
          break;
        }
      }

      let cachedData = null;
      if (canonicalUsername) {
        cachedData = await db.get(CACHE_NAME, canonicalUsername);
      }

      // If cached data is found and fresh, use it
      if (cachedData) {
        const now = Date.now();
        const cacheAge = now - (cachedData.timestamp || 0);
        if (cacheAge < 3600000) { // 1 hour freshness check
          setViewedOwnershipData(cachedData.ownershipData);
          setUserExists(true);
          setCanonicalUsername(cachedData.username); // Add this line to set username from cache
          if (setOwnershipFilter) setOwnershipFilter(defaultFilter);
          if (setShowAll) setShowAll(true);
          return cachedData.username; // Return the username from cache
        } else {
          // Remove stale cache
          await db.delete(CACHE_NAME, canonicalUsername);
        }
      }

      // No valid cache entry found, so hit the API
      const response = await fetch(
        `${USERS_API_URL}/ownershipData/username/${lowerCaseUsername}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      if (response.ok) {
        const result = await response.json();

        // Use the canonical username from the result or fallback to searchedUsername
        const actualUsername = result.username || searchedUsername;
        setCanonicalUsername(actualUsername);

        // Update state with the retrieved data
        setViewedOwnershipData(result.instances);
        setUserExists(true);
        if (setOwnershipFilter) setOwnershipFilter(defaultFilter);
        if (setShowAll) setShowAll(true);

        // Cache the data using the canonical username
        const cacheEntry = {
          username: actualUsername,
          ownershipData: result.instances,
          timestamp: Date.now(),
        };
        await db.put(CACHE_NAME, cacheEntry);

        return actualUsername; // Return the canonical username
      } else if (response.status === 404) {
        setUserExists(false);
        setViewedOwnershipData(null);
        setCanonicalUsername(null);
      } else {
        console.error('Error fetching user data:', response.statusText);
        setViewedOwnershipData(null);
        setCanonicalUsername(null);
      }
    } catch (error) {
      console.error(`Fetch error for username ${searchedUsername}:`, error);
      setViewedOwnershipData(null);
      setCanonicalUsername(null);
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
        setUserExists,
        setViewedOwnershipData,
        canonicalUsername,
        setCanonicalUsername,
      }}
    >
      {children}
    </UserSearchContext.Provider>
  );
}

export default UserSearchContext;