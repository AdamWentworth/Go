// TradeDataContext.js
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { proposeTrade as proposeTradeService } from './TradeData/proposeTrade';
import { usePokemonData } from './PokemonDataContext';
import {
  setTradesinDB,
  getAllFromTradesDB,
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
      
      const tradesArray = Object.keys(newTradesObj).map(tradeId => ({
        trade_id: tradeId,
        ...newTradesObj[tradeId]
      }));
      
      // Update IndexedDB
      await setTradesinDB('pokemonTrades', tradesArray);
      
      // Update state
      setTrades(prevTrades => ({
        ...prevTrades,
        ...newTradesObj
      }));
      
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
        const { tradeId, relatedInstance } = await proposeTradeService(tradeData);
        
        // Exclude the nested `pokemon` property before constructing the new trade
        const { pokemon, ...remainingTradeData } = tradeData;
        const newTrade = { 
          ...remainingTradeData, 
          trade_id: tradeId 
        };
        console.log(newTrade)
  
        await setTradeData({
          [tradeId]: newTrade
        });
  
        if (relatedInstance) {
          await setRelatedInstances({
            [relatedInstance.instance_id]: relatedInstance
          });
        }
  
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
