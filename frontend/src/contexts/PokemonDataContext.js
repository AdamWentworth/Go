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

    const [isInitialSyncScheduled, setIsInitialSyncScheduled] = useState(false);
    const [timerValue, setTimerValue] = useState(0);
    const countdownRef = useRef(null);

    const ownershipDataRef = useRef(data.ownershipData);

    useEffect(() => {
        if (data.loading) {
            fetchData(setData, ownershipDataRef, updateOwnership, updateLists).catch(error => {
                console.error("Failed to load Pokemon data:", error);
                setData(prev => ({ ...prev, loading: false }));
            });
        }
    }, [data.loading]);

    useEffect(() => {
        if (isInitialSyncScheduled && countdownRef.current) {
            const interval = setInterval(() => {
                setTimerValue(prev => {
                    if (prev <= 1) {
                        console.log("Timer has expired. Resetting isInitialSyncScheduled to false.");
                        clearInterval(interval);
                        countdownRef.current = null;
                        setIsInitialSyncScheduled(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [isInitialSyncScheduled]);

    const startCountdown = useCallback(() => {
        if (!countdownRef.current) {
            console.log("Starting a 60-second countdown and setting isInitialSyncScheduled to true.");
            setIsInitialSyncScheduled(true);
            setTimerValue(60);
            countdownRef.current = setTimeout(() => {
                console.log("Countdown complete. Timer expired.");
                countdownRef.current = null;
                setIsInitialSyncScheduled(false);
            }, 60000);
        } else {
            console.log("Countdown is already active.");
        }
    }, []);

    const updateLists = useCallback(importedUpdateLists(data, setData), [data.ownershipData, data.variants]);

    const updateOwnership = useCallback((...args) => {
        startCountdown();
        importedUpdateOwnership(data, setData, ownershipDataRef, updateLists, isInitialSyncScheduled, setIsInitialSyncScheduled, startCountdown, timerValue)(...args);
    }, [data.variants, updateLists, startCountdown, isInitialSyncScheduled, setIsInitialSyncScheduled, timerValue]);

    const updateDetails = useCallback((...args) => {
        startCountdown();
        importedUpdateDetails(data, setData, updateLists, isInitialSyncScheduled, setIsInitialSyncScheduled, startCountdown, timerValue)(...args);
    }, [data.ownershipData, updateLists, startCountdown, isInitialSyncScheduled, setIsInitialSyncScheduled, timerValue]);

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
        isInitialSyncScheduled
    }), [data, updateOwnership, updateDetails, isInitialSyncScheduled]);

    return (
        <PokemonDataContext.Provider value={contextValue}>
            {children}
        </PokemonDataContext.Provider>
    );
};

export { PokemonDataContext };