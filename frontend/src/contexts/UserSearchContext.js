// UserSearchContext.js

import React, { createContext, useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const UserSearchContext = createContext();
const EVENTS_API_URL = process.env.REACT_APP_EVENTS_API_URL;
const CACHE_NAME = 'pokemonCache';
const CACHE_KEY = 'pokemonSearch';

export function UserSearchProvider({ children }) {
    const [viewedOwnershipData, setViewedOwnershipData] = useState(null);
    const [userExists, setUserExists] = useState(null);  // null indicates loading
    const [viewedLoading, setViewedLoading] = useState(false);
    const location = useLocation();

    // Determine if the current path matches /:username
    const isUsernamePath = /^\/[^/]+$/.test(location.pathname);
    const fetchUserOwnershipData = useCallback(async (searchedUsername, setOwnershipFilter, setShowAll) => {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(CACHE_KEY);

        // Reset states before fetching new data
        setViewedLoading(true);
        setUserExists(null);

        // Check if cached data matches the searched username
        if (cachedResponse) {
            const cachedData = await cachedResponse.json();
            if (cachedData.username === searchedUsername) {
                setViewedOwnershipData(cachedData.ownershipData);
                setUserExists(true);
                setViewedLoading(false);

                // Invoke setter callbacks
                if (setOwnershipFilter) setOwnershipFilter("Owned");
                if (setShowAll) setShowAll(true);

                return;
            }
        }

        try {
            const response = await fetch(`${EVENTS_API_URL}/ownershipData/username/${searchedUsername}`, {
                method: 'GET',
                credentials: 'include',  // Include credentials for authenticated requests
            });

            if (response.ok) {
                const data = await response.json();
                setViewedOwnershipData(data);
                setUserExists(true);

                // Invoke setter callbacks upon successful fetch
                if (setOwnershipFilter) setOwnershipFilter("Owned");
                if (setShowAll) setShowAll(true);

                if (isUsernamePath) {
                    const cacheResponse = new Response(
                        JSON.stringify({ username: searchedUsername, ownershipData: data })
                    );
                    await cache.put(CACHE_KEY, cacheResponse); // Overwrite cache with new data
                }
            } else if (response.status === 404) {
                setViewedOwnershipData(null);
                setUserExists(false);  // User not found

                // Optionally, you can reset filters here or handle as needed
                if (setOwnershipFilter) setOwnershipFilter("");
                if (setShowAll) setShowAll(false);
            } else {
                console.error("Error fetching user ownership data:", response.statusText);
                setUserExists(false);  // Treat other errors as user not found

                if (setOwnershipFilter) setOwnershipFilter("");
                if (setShowAll) setShowAll(false);
            }
        } catch (error) {
            console.error("Error fetching user ownership data:", error);
            setUserExists(false);  // Treat network errors as user not found

            if (setOwnershipFilter) setOwnershipFilter("");
            if (setShowAll) setShowAll(false);
        } finally {
            setViewedLoading(false);
        }
    }, [isUsernamePath, EVENTS_API_URL]);

    useEffect(() => {
        const loadFromCache = async () => {
            if (isUsernamePath) {
                const cache = await caches.open(CACHE_NAME);
                const cachedResponse = await cache.match(CACHE_KEY);

                if (cachedResponse) {
                    const cachedData = await cachedResponse.json();
                    setViewedOwnershipData(cachedData.ownershipData);
                    setUserExists(true);
                } else {
                    // If not in cache, fetch from API
                    const path = location.pathname;
                    const match = path.match(/^\/([^/]+)$/);
                    const username = match ? match[1] : null;
                    if (username) {
                        fetchUserOwnershipData(username);
                    }
                }
            }
        };
        loadFromCache();
    }, [isUsernamePath, location.pathname, fetchUserOwnershipData]);

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
