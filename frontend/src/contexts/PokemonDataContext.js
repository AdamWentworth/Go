// PokemonDataContext.js

import React, { useContext, createContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { initializePokemonLists } from '../components/Collect/PokemonOwnership/PokemonTradeListOperations';
import { fetchData } from './PokemonData/fetchData';
import { updateOwnership as importedUpdateOwnership } from './PokemonData/updateOwnership';
import { updateLists as importedUpdateLists } from './PokemonData/updateLists';
import { updateDetails as importedUpdateDetails } from './PokemonData/updateDetails';
import { mergeOwnershipData as importedMergeOwnershipData } from './PokemonData/mergeOwnershipData';

const PokemonDataContext = createContext();

export const usePokemonData = () => useContext(PokemonDataContext);

export const PokemonDataProvider = ({ children }) => {
    const [data, setData] = useState({
        variants: [],
        ownershipData: {},
        lists: {},
        loading: true
    });

    const ownershipDataRef = useRef(data.ownershipData);

    useEffect(() => {
        if (data.loading) {
            fetchData(setData, ownershipDataRef, updateOwnership, updateLists).catch(error => {
                console.error("Failed to load Pokemon data:", error);
                setData(prev => ({ ...prev, loading: false }));
            });
        }
    }, [data.loading]);

    const updateLists = useCallback(importedUpdateLists(data, setData), [data.ownershipData, data.variants]);

    let scheduledSync;
    let timer;

    const periodicUpdates = useCallback(() => {
        if (scheduledSync == null) {
            console.log("First call: Triggering immediate update.");
            
            // First call, trigger the immediate update
            navigator.serviceWorker.ready.then(registration => {
                registration.active.postMessage({
                    action: 'sendBatchedUpdatesToBackend'
                });
                console.log("Immediate update sent to backend.");
            });
            scheduledSync = true;

            // Set a 60-second timer to handle future batched updates
            console.log("Setting 60-second timer for future batched updates.");
            timer = setTimeout(function sendUpdates() {
                console.log("Timer expired: Checking for batched updates in cache.");
                
                caches.open('pokemonCache').then(cache => {
                    cache.match('/batchedUpdates').then(response => {
                        if (!response) {
                            // If cache is empty, stop periodic updates
                            console.log("No updates in cache: Stopping periodic updates.");
                            scheduledSync = null;
                            timer = null;
                        } else {
                            // Cache is not empty, send batched updates
                            console.log("Updates found in cache: Sending batched updates to backend.");
                            navigator.serviceWorker.ready.then(registration => {
                                registration.active.postMessage({
                                    action: 'sendBatchedUpdatesToBackend'
                                });
                                console.log("Batched updates sent to backend.");
                            });

                            // Set the next 60-second timer for the next update
                            console.log("Setting another 60-second timer for the next update.");
                            timer = setTimeout(sendUpdates, 60000);
                        }
                    });
                });
            }, 60000);

        } else {
            console.log("Function called again but is currently waiting for the timer to expire.");
        }
    }, []);

    const updateOwnership = useCallback((...args) => {
        importedUpdateOwnership(data, setData, ownershipDataRef, updateLists)(...args);
        periodicUpdates();
    }, [data.variants, updateLists]);

    const updateDetails = useCallback((...args) => {
        importedUpdateDetails(data, setData, updateLists)(...args);
        periodicUpdates();
    }, [data.ownershipData, updateLists]);

    useEffect(() => {
        ownershipDataRef.current = data.ownershipData;
    }, [data.ownershipData]);

    const resetData = () => {
        setData({
            variants: [],
            ownershipData: {},
            lists: {},
            loading: true
        });
    };

    const setOwnershipData = (newOwnershipData) => {
        setData(prevData => {
            const updatedOwnershipData = importedMergeOwnershipData(prevData.ownershipData, newOwnershipData);
            ownershipDataRef.current = updatedOwnershipData;

            localStorage.setItem('pokemonOwnership', JSON.stringify({ data: updatedOwnershipData, timestamp: Date.now() }));

            return {
                ...prevData,
                ownershipData: updatedOwnershipData,
                lists: initializePokemonLists(updatedOwnershipData, prevData.variants),
            };
        });

        navigator.serviceWorker.ready.then(registration => {
            registration.active.postMessage({
                action: 'syncData',
                data: { data: ownershipDataRef.current, timestamp: Date.now() }
            });
            registration.active.postMessage({
                action: 'syncLists',
                data: { data: initializePokemonLists(ownershipDataRef.current, data.variants), timestamp: Date.now() }
            });
        });
    };

    const contextValue = useMemo(() => ({
        ...data,
        updateOwnership,
        updateLists,
        updateDetails,
        setOwnershipData,
        resetData,
        }), [data, updateOwnership, updateDetails ]);

    return (
        <PokemonDataContext.Provider value={contextValue}>
            {children}
        </PokemonDataContext.Provider>
    );
};

export { PokemonDataContext };
