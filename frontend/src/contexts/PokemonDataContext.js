// PokemonDataContext.js

import React, { useContext, createContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { initializePokemonLists } from '../components/Collect/PokemonOwnership/PokemonTradeListOperations';
import { fetchData } from './PokemonData/fetchData';
import { updateOwnership as importedUpdateOwnership } from './PokemonData/updateOwnership';
import { updateLists as importedUpdateLists } from './PokemonData/updateLists';
import { updateDetails as importedUpdateDetails } from './PokemonData/updateDetails';
import { mergeOwnershipData as importedMergeOwnershipData } from './PokemonData/mergeOwnershipData';
import { periodicUpdates as importedperiodicUpdates } from './PokemonData/periodicUpdates';  
import { checkBatchedUpdates as importedcheckBatchedUpdates } from './PokemonData/checkBatchedUpdates';  


import { useGlobalState } from './GlobalStateContext';

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
    const { isLoggedIn } = useGlobalState(); // Access the global state

    const scheduledSyncRef = useRef(null); // Ref to manage scheduledSync
    const timerRef = useRef(null); // Ref to manage timer

    const periodicUpdates = useCallback(importedperiodicUpdates(scheduledSyncRef, timerRef), []);

    useEffect(() => {
        if (data.loading) {
            fetchData(setData, ownershipDataRef, updateOwnership, updateLists).catch(error => {
                console.error("Failed to load Pokemon data:", error);
                setData(prev => ({ ...prev, loading: false }));
            });
        }
    }, [data.loading]);

    const updateLists = useCallback(importedUpdateLists(data, setData), [data.ownershipData, data.variants]);

    const relevantOwnershipData = useMemo(() => 
        Object.fromEntries(
            Object.entries(data.ownershipData).map(([key, pokemon]) => [
                key,
                {
                    is_for_trade: pokemon.is_for_trade,
                    is_wanted: pokemon.is_wanted,
                    is_owned: pokemon.is_owned,
                    is_unowned: pokemon.is_unowned,
                },
            ])
        ), [data.ownershipData]
    );
    
    useEffect(() => {
        if (!data.loading) {
            updateLists();
        }
    }, [relevantOwnershipData, data.variants]);    

    useEffect(() => {
        if (isLoggedIn) {
            importedcheckBatchedUpdates(periodicUpdates);  // Use the modularized checkBatchedUpdates
        }
    }, [isLoggedIn, periodicUpdates]);   

    const updateOwnership = useCallback((...args) => {
        importedUpdateOwnership(data, setData, ownershipDataRef, updateLists)(...args);
        if (isLoggedIn) {
            periodicUpdates();
        }
    }, [data.variants, updateLists]);

    const updateDetails = useCallback((...args) => {
        importedUpdateDetails(data, setData, updateLists)(...args);
        if (isLoggedIn) {
            periodicUpdates();
        }
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
