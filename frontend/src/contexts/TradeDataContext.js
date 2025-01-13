// TradeDataContext.js
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { proposeTrade as proposeTradeService } from './TradeData/proposeTrade';
import { usePokemonData } from './PokemonDataContext';
import {
  setTradesinDB,
  getAllFromTradesDB,
  putBatchedTradeUpdates,
  deleteFromTradesDB
} from '../services/indexedDB';

const TradeDataContext = createContext();
export const useTradeData = () => useContext(TradeDataContext);

export const TradeDataProvider = ({ children }) => {
  const { periodicUpdates } = usePokemonData();

  // State for trades and related instances
  const [trades, setTrades] = useState({});
  const [relatedInstances, setRelatedInstancesState] = useState({});

  // Define base data management functions first
  const setTradeData = useCallback(async (newTradesObj) => {
    try {
      if (!newTradesObj) return;
  
      // Handle deleted trades: remove from IndexedDB and state
      for (const [id, trade] of Object.entries(newTradesObj)) {
        if (trade.trade_status === 'deleted') {
          // Remove trade from IndexedDB
          await deleteFromTradesDB('pokemonTrades', id);
          // Remove deleted trade from newTradesObj so it's not processed further
          delete newTradesObj[id];
          // Remove deleted trade from in-memory state
          setTrades(prev => {
            const { [id]: removed, ...rest } = prev;
            return rest;
          });
        }
      }
  
      // Prepare remaining trades for IndexedDB update
      const tradesArray = Object.keys(newTradesObj).map(tradeId => ({
        trade_id: tradeId,
        ...newTradesObj[tradeId]
      }));
  
      // Update IndexedDB with remaining trades
      await setTradesinDB('pokemonTrades', tradesArray);
  
      // Update state for remaining trades
      setTrades(prevTrades => {
        // If the new trades object has fewer keys than the previous state, assume a removal and replace state entirely
        if (Object.keys(newTradesObj).length < Object.keys(prevTrades).length) {
          return newTradesObj;
        }
        return { ...prevTrades, ...newTradesObj };
      });
  
      return newTradesObj;
    } catch (err) {
      console.error('[setTradeData] ERROR:', err);
      throw err;
    }
  }, []);  

  const setRelatedInstances = useCallback(async (newInstancesObj) => {
    try {
      if (!newInstancesObj) return;
      
      const instancesArray = Object.keys(newInstancesObj).map(instanceId => ({
        instance_id: instanceId,
        ...newInstancesObj[instanceId]
      }));
      
      // Update IndexedDB
      await setTradesinDB('relatedInstances', instancesArray);
      
      // Update state
      setRelatedInstancesState(prevInstances => ({
        ...prevInstances,
        ...newInstancesObj
      }));
      
      return newInstancesObj;
    } catch (err) {
      console.error('[setRelatedInstances] ERROR:', err);
      throw err;
    }
  }, []);

  // Functions that depend on setTradeData and setRelatedInstances
  const updateTradeData = useCallback(async (newTrades, newInstances) => {
    try {
      if (newTrades) {
        await setTradeData(newTrades);
      }
      if (newInstances) {
        await setRelatedInstances(newInstances);
      }
    } catch (err) {
      console.error('[updateTradeData] ERROR:', err);
    }
  }, [setTradeData, setRelatedInstances]);

  const proposeTrade = useCallback(
    async (tradeData) => {
        try {
            // Get prepared trade data without DB operations
            const { tradeEntry, relatedInstanceData } = await proposeTradeService(tradeData);
            const tradeId = tradeEntry.trade_id;

            // Update state and IndexedDB in one place
            await setTradeData({
                [tradeId]: tradeEntry
            });

            // Create related instance
            const relatedInstance = {
                ...relatedInstanceData,
                trade_id: tradeId
            };
            await setRelatedInstances({
                [relatedInstance.instance_id]: relatedInstance
            });

            // Add to batched updates
            await putBatchedTradeUpdates(tradeId, {
                operation: 'createTrade',
                tradeData: tradeEntry
            });

            periodicUpdates();
            return { success: true, tradeId };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    [periodicUpdates, setTradeData, setRelatedInstances]
  );

  // New resetTradeData function to clear trades and relatedInstances
  const resetTradeData = useCallback(() => {
    setTrades({});
    setRelatedInstancesState({});

  }, []);

  // Initialize data on mount
  useEffect(() => {
    async function initializeTradeData() {
      try {
        // Load trades from IndexedDB
        const tradesFromDB = await getAllFromTradesDB('pokemonTrades');
        const tradesObj = tradesFromDB.reduce((acc, trade) => {
          acc[trade.trade_id] = { ...trade };
          return acc;
        }, {});
        await setTradeData(tradesObj);

        // Load related instances from IndexedDB
        const instancesFromDB = await getAllFromTradesDB('relatedInstances');
        const instancesObj = instancesFromDB.reduce((acc, instance) => {
          acc[instance.instance_id] = { ...instance };
          return acc;
        }, {});
        await setRelatedInstances(instancesObj);

      } catch (error) {
        console.error('Error initializing TradeDataContext:', error);
      }
    }

    initializeTradeData();
  }, [setTradeData, setRelatedInstances]);

  const contextValue = {
    proposeTrade,
    setTradeData,
    setRelatedInstances,
    updateTradeData,
    resetTradeData,
    trades,
    relatedInstances
  };

  return (
    <TradeDataContext.Provider value={contextValue}>
      {children}
    </TradeDataContext.Provider>
  );
};
