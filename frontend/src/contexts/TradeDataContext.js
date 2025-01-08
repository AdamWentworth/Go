// src/contexts/TradeDataContext.js (or TradeDataProvider.js)
import React, { createContext, useContext, useState, useCallback } from 'react';
import { proposeTrade as proposeTradeService } from './TradeData/proposeTrade';
import { usePokemonData } from './PokemonDataContext';
import {
  setTradesinDB
} from '../services/indexedDB';

const TradeDataContext = createContext();

export const useTradeData = () => useContext(TradeDataContext);

export const TradeDataProvider = ({ children }) => {
  const { periodicUpdates } = usePokemonData();

  // State for trades and related instances
  const [trades, setTrades] = useState({});
  const [relatedInstances, setRelatedInstancesState] = useState({});

  // For proposing a trade
  const proposeTrade = useCallback(
    async (tradeData) => {
      try {
        const tradeId = await proposeTradeService(tradeData);
        periodicUpdates();
        return { success: true, tradeId };
      } catch (error) {
        // Return a structured error response without throwing
        return { success: false, error: error.message };
      }
    },
    [periodicUpdates]
  );

  /**
   * Set the entire trades object in state
   * and bulk-save to "pokemonTrades" store in indexedDB.
   */
  const setTradeData = useCallback(async (newTradesObj) => {
    try {

      // Convert to an array for bulk storing
      const tradesArray = Object.keys(newTradesObj).map((tradeId) => {
        return { trade_id: tradeId, ...newTradesObj[tradeId] };
      });

      // Write them in one go
      await setTradesinDB('pokemonTrades', tradesArray);

      // Update React state
      setTrades(newTradesObj);

      return newTradesObj;
    } catch (err) {
      console.error('[setTradeData] ERROR:', err);
      throw err;
    }
  }, []);

  /**
   * Set the entire related instances object in state
   * and bulk-save to "relatedInstances" store in indexedDB.
   */
  const setRelatedInstances = useCallback(async (newInstancesObj) => {
    try {

      // Convert object to array
      const instancesArray = Object.keys(newInstancesObj).map((instanceId) => {
        return { instance_id: instanceId, ...newInstancesObj[instanceId] };
      });

      // Write them to IndexedDB
      await setTradesinDB('relatedInstances', instancesArray);

      // Update React state
      setRelatedInstancesState(newInstancesObj);

      return newInstancesObj;
    } catch (err) {
      console.error('[setRelatedInstances] ERROR:', err);
      throw err;
    }
  }, []);

  const contextValue = {
    proposeTrade,
    setTradeData,
    setRelatedInstances,
    trades,
    relatedInstances,
  };

  return (
    <TradeDataContext.Provider value={contextValue}>
      {children}
    </TradeDataContext.Provider>
  );
};
