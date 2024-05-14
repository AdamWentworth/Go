// ownershipHooks.js
import { useContext, useEffect } from 'react';
import CacheContext from '../../../contexts/CacheContext'; // Import the cache context

export const useLoadOwnershipData = (setOwnershipData) => {
    const cache = useContext(CacheContext);
    
    useEffect(() => {
        async function fetchData() {
            const cacheKey = "pokemonOwnership";
            const ownershipDataCache = await cache.get(cacheKey);

            if (ownershipDataCache && new Date() - new Date(ownershipDataCache.timestamp) < 24 * 3600 * 1000) {
                // Data is fresh
                console.log("Using cached ownership data");
                setOwnershipData(ownershipDataCache.data);
            } else {
                // Fetch from localStorage or initialize if necessary
                let data = JSON.parse(localStorage.getItem(cacheKey)) || {};
                if (!Object.keys(data).length || new Date() - new Date(data.timestamp) >= 24 * 3600 * 1000) {
                    console.log("Fetching new data from the server or initializing...");
                    // Assume fetchOwnershipDataFromServer is a function that fetches data from a server
                    data = await fetchOwnershipDataFromServer();
                    localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: new Date() }));
                }
                cache.set(cacheKey, { data, timestamp: new Date() }); // Update cache
                setOwnershipData(data);
            }
        }

        fetchData();
    }, [cache, setOwnershipData]);
};

function fetchOwnershipDataFromServer() {
    // Mock fetching data from a server
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                key1: { unowned: true, owned: false, trade: false, wanted: false },
                key2: { unowned: false, owned: true, trade: true, wanted: false }
            });
        }, 1000);
    });
}
