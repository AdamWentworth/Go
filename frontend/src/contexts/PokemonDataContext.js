// PokemonDataContext.js

import React, { useContext, createContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { initializePokemonLists } from '../components/Collect/PokemonOwnership/PokemonTradeListOperations';

import { fetchData } from './PokemonData/fetchData';
import { updateOwnership as importedUpdateOwnership } from './PokemonData/updateOwnership';
import { updateLists as importedUpdateLists } from './PokemonData/updateLists';
import { updateDetails as importedUpdateDetails } from './PokemonData/updateDetails';
import { mergeOwnershipData as importedMergeOwnershipData } from './PokemonData/mergeOwnershipData';

// Create a React context for sharing Pokemon data across components
const PokemonDataContext = createContext();

// Custom hook to use the context
export const usePokemonData = () => useContext(PokemonDataContext);

// Context provider component that wraps around children components
export const PokemonDataProvider = ({ children }) => {
    // State to hold all Pokemon data and loading status
    const [data, setData] = useState({
        variants: [],
        ownershipData: {},
        lists: {},
        loading: true
    });

    // Ref to always hold the latest ownershipData
    const ownershipDataRef = useRef(data.ownershipData);

    // Effect to fetch data on component mount
    useEffect(() => {
        if (data.loading) {
            fetchData(setData, ownershipDataRef, updateOwnership, updateLists).catch(error => {
                console.error("Failed to load Pokemon data:", error);
                setData(prev => ({ ...prev, loading: false }));
            });
        }
    }, [data.loading]);    

    // Function to update Pokemon lists
    const updateLists = useCallback(importedUpdateLists(data, setData), [data.ownershipData, data.variants]);

    // Function to update ownership status
    const updateOwnership = useCallback(importedUpdateOwnership(data, setData, ownershipDataRef, updateLists), [data.variants, updateLists]);

    // Function to update Instance details
    const updateDetails = useCallback(importedUpdateDetails(data, setData, updateLists), [data.ownershipData, updateLists]);
    
    useEffect(() => {
        ownershipDataRef.current = data.ownershipData;
    }, [data.ownershipData]);   
    
    // Define the resetData function
    const resetData = () => {
        // Reset the state to the initial loading state
        setData({
            variants: [],
            ownershipData: {},
            lists: {},
            loading: true // This will trigger the useEffect to refetch data
        });
    };

    const setOwnershipData = (newOwnershipData) => {
        setData(prevData => {
            const updatedOwnershipData = importedMergeOwnershipData(prevData.ownershipData, newOwnershipData);
            // Immediately update the ref to keep it in sync with state changes.
            ownershipDataRef.current = updatedOwnershipData;
    
            localStorage.setItem('pokemonOwnership', JSON.stringify({ data: updatedOwnershipData, timestamp: Date.now() }));
    
            // Update state
            return {
                ...prevData,
                ownershipData: updatedOwnershipData,
                lists: initializePokemonLists(updatedOwnershipData, prevData.variants),
            };
        });
    
        // Now post the updated data to service workers or any other side effects
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
    
    // Context value includes all state and the update function
    const contextValue = useMemo(() => ({
        ...data,
        updateOwnership,
        updateLists,
        updateDetails,
        setOwnershipData,
        resetData
    }), [data, updateOwnership, updateDetails]);

    // Provider wraps children with the Pokemon data context
    return (
        <PokemonDataContext.Provider value={contextValue}>
            {children}
        </PokemonDataContext.Provider>
    );
};

// Exporting the Context object itself along with other components
export { PokemonDataContext };