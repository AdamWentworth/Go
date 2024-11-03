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
    
                if (setOwnershipFilter) setOwnershipFilter("Owned");
                if (setShowAll) setShowAll(true);
    
                return;
            }
        }
    
        try {
            const response = await fetch(`${EVENTS_API_URL}/ownershipData/username/${searchedUsername}`, {
                method: 'GET',
                credentials: 'include',
            });
    
            if (response.ok) {
                const data = await response.json();
                setViewedOwnershipData(data);
                setUserExists(true);
    
                if (setOwnershipFilter) setOwnershipFilter("Owned");
                if (setShowAll) setShowAll(true);
    
                if (isUsernamePath) {
                    const cacheResponse = new Response(
                        JSON.stringify({ username: searchedUsername, ownershipData: data })
                    );
                    await cache.put(CACHE_KEY, cacheResponse);
                }
            } else if (response.status === 404) {
                // User not found
                setViewedOwnershipData(null);
                setUserExists(false);
                if (setOwnershipFilter) setOwnershipFilter("");
                if (setShowAll) setShowAll(false);
            } else if (response.status === 403) {
                // Handle Forbidden without affecting `userExists`
                console.warn("Access to user data is forbidden. Falling back to default data.");
                setViewedOwnershipData(null); // Avoid blocking the default data
            } else {
                console.error("Error fetching user ownership data:", response.statusText);
                setViewedOwnershipData(null);
            }
        } catch (error) {
            console.error("Error fetching user ownership data:", error);
            setViewedOwnershipData(null);
        } finally {
            setViewedLoading(false);
        }
    }, [isUsernamePath, EVENTS_API_URL]);    

    useEffect(() => {
        const loadFromCache = async () => {
            const path = location.pathname;
            const match = path.match(/^\/([^/]+)$/);  // Match only paths with a username
            const username = match ? match[1] : null;
    
            // Skip fetch if path is `/collect`
            if (path === "/collect") {
                setViewedOwnershipData(null);
                setUserExists(null); // Indicates no username search in this case
                return;
            }
    
            if (isUsernamePath && username) {
                const cache = await caches.open(CACHE_NAME);
                const cachedResponse = await cache.match(CACHE_KEY);
    
                if (cachedResponse) {
                    const cachedData = await cachedResponse.json();
                    setViewedOwnershipData(cachedData.ownershipData);
                    setUserExists(true);
                } else {
                    // Fetch from API if no cached data is found and username exists
                    fetchUserOwnershipData(username);
                }
            } else {
                setViewedOwnershipData(null);
                setUserExists(null); // Indicates no search has been done yet
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
