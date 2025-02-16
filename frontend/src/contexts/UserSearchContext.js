// UserSearchContext.js

import React, { createContext, useState } from 'react';
import { openDB } from 'idb';
import { useModal } from './ModalContext';

const UserSearchContext = createContext();
const USERS_API_URL = process.env.REACT_APP_USERS_API_URL;
const CACHE_NAME = 'SearchCache';

export function UserSearchProvider({ children }) {
  const { alert } = useModal();

  const [viewedOwnershipData, setViewedOwnershipData] = useState(null);
  const [userExists, setUserExists] = useState(null);
  const [viewedLoading, setViewedLoading] = useState(false);
  const [canonicalUsername, setCanonicalUsername] = useState(null);

  const fetchUserOwnershipData = async (
    searchedUsername,
    setOwnershipFilter,
    defaultFilter = 'Owned'
  ) => {
    // console.log('[UserSearchContext] Setting ownership filter:', defaultFilter);
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

      // Try to find a canonical key in our cache ignoring case
      let actualKey = null;
      const allKeys = await db.getAllKeys(CACHE_NAME);
      for (const key of allKeys) {
        if (typeof key === 'string' && key.toLowerCase() === lowerCaseUsername) {
          actualKey = key;
          break;
        }
      }

      // Retrieve cached data (if any)
      let cachedData = null;
      if (actualKey) {
        cachedData = await db.get(CACHE_NAME, actualKey);
      }

      // Grab our ETag from the cached data (if we have any).
      const cachedEtag = cachedData?.etag || null;

      // Always perform a fetch, providing If-None-Match if we have an ETag
      const response = await fetch(
        `${USERS_API_URL}/ownershipData/username/${lowerCaseUsername}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            ...(cachedEtag ? { 'If-None-Match': cachedEtag } : {}),
          },
        }
      );

      if (response.status === 304) {
        // The data hasn't changed since the last time we fetched it.
        if (cachedData) {
          // Use our cached data
          setViewedOwnershipData(cachedData.ownershipData);
          setUserExists(true);
          setCanonicalUsername(cachedData.username);
          if (setOwnershipFilter) setOwnershipFilter(defaultFilter);
          setViewedLoading(false);
          return cachedData.username;
        } else {
          // 304 but we have no cache? That's unusual. You could handle differently (re-fetch without ETag, etc.)
          console.warn(
            'Received 304 Not Modified but have no cached data. Falling back to "not found" behavior.'
          );
          setUserExists(false);
          setViewedOwnershipData(null);
          setCanonicalUsername(null);
          setViewedLoading(false);
          return;
        }
      }

      if (response.ok) {
        // We have a new or updated response (200 OK)
        const result = await response.json();
        const actualUsername = result.username || searchedUsername;
        setCanonicalUsername(actualUsername);
        setViewedOwnershipData(result.instances);
        setUserExists(true);
        if (setOwnershipFilter) {
          // console.log('[UserSearchContext] Setting filter to:', defaultFilter);
          setOwnershipFilter(defaultFilter);
        }
        // Grab the ETag from the response, if it exists
        const responseEtag = response.headers.get('ETag') || null;

        // Cache with updated data and ETag
        const now = Date.now();
        const cacheEntry = {
          username: actualUsername,
          ownershipData: result.instances,
          timestamp: now,
          etag: responseEtag,
        };
        await db.put(CACHE_NAME, cacheEntry);

        setViewedLoading(false);
        return actualUsername;
      } else if (response.status === 404) {
        // User not found
        setUserExists(false);
        setViewedOwnershipData(null);
        setCanonicalUsername(null);
      } else if (response.status === 403) {
        // Forbidden: user must be logged in
        await alert('You must be logged in to perform this search.');
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
