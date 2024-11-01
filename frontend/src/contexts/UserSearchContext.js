// UserSearchContext.js

import React, { createContext, useState, useCallback } from 'react';

const UserSearchContext = createContext();

const EVENTS_API_URL = process.env.REACT_APP_EVENTS_API_URL;

export function UserSearchProvider({ children }) {
    const [viewedOwnershipData, setViewedOwnershipData] = useState(null);
    const [userExists, setUserExists] = useState(true);
    const [viewedLoading, setViewedLoading] = useState(false);

    const fetchUserOwnershipData = useCallback(async (searchedUsername) => {
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
    }, []);

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
