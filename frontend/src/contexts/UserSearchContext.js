// UserSearchContext.js

import React, { createContext, useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const UserSearchContext = createContext();
const EVENTS_API_URL = process.env.REACT_APP_EVENTS_API_URL;
const CACHE_NAME = 'pokemonCache';
const CACHE_KEY = 'pokemonSearch'; 

export function UserSearchProvider({ children }) {
    const [viewedOwnershipData, setViewedOwnershipData] = useState(null);
    const [userExists, setUserExists] = useState(true);
    const [viewedLoading, setViewedLoading] = useState(false);
    const location = useLocation();

    // Check if the path matches /:username pattern
    const isUsernamePath = /^\/[^/]+$/.test(location.pathname);

    const fetchUserOwnershipData = useCallback(async (searchedUsername) => {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(CACHE_KEY);

        if (cachedResponse) {
            const cachedData = await cachedResponse.json();
            if (cachedData.username === searchedUsername) {
                // If the cached username matches the searched username, use it
                setViewedOwnershipData(cachedData.ownershipData);
                setUserExists(true);
                return;
            }
        }

        // If not in cache or cached username differs, make the API call
        setViewedLoading(true);
        try {
            const response = await fetch(`${EVENTS_API_URL}/ownershipData/username/${searchedUsername}`, {
                method: 'GET',
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                setViewedOwnershipData(data);
                setUserExists(true);

                // Save the new data to CacheStorage as the single entry
                if (isUsernamePath) {
                    const cacheResponse = new Response(
                        JSON.stringify({ username: searchedUsername, ownershipData: data })
                    );
                    await cache.put(CACHE_KEY, cacheResponse); // Overwrite any existing entry in CACHE_KEY
                }
            } else if (response.status === 404) {
                setUserExists(false);
            } else {
                console.error("Error fetching user ownership data:", response.statusText);
            }
        } catch (error) {
            console.error("Error fetching user ownership data:", error);
            setUserExists(false);
        } finally {
            setViewedLoading(false);
        }
    }, [isUsernamePath]);

    // Load data from CacheStorage on initial mount if present and if on /:username
    useEffect(() => {
        const loadFromCache = async () => {
            if (isUsernamePath) {
                const cache = await caches.open(CACHE_NAME);
                const cachedResponse = await cache.match(CACHE_KEY);

                if (cachedResponse) {
                    const cachedData = await cachedResponse.json();
                    setViewedOwnershipData(cachedData.ownershipData);
                    setUserExists(true);
                }
            }
        };
        loadFromCache();
    }, [isUsernamePath, location.pathname]);

    return (
        <UserSearchContext.Provider
            value={{
                viewedOwnershipData,
                userExists,
                viewedLoading,
                fetchUserOwnershipData,
            }}
        >
            {children}
        </UserSearchContext.Provider>
    );
}

export default UserSearchContext;
