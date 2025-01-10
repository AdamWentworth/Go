// TradeDataContext.js
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { proposeTrade as proposeTradeService } from './TradeData/proposeTrade';
import { usePokemonData } from './PokemonDataContext';
import {
  setTradesinDB,
  getAllFromTradesDB
} from '../services/indexedDB';

const TradeDataContext = createContext();

export const useTradeData = () => useContext(TradeDataContext);

export const TradeDataProvider = ({ children }) => {
  const { periodicUpdates } = usePokemonData();

  // State for trades and related instances
  const [trades, setTrades] = useState({});
  const [relatedInstances, setRelatedInstancesState] = useState({});

  const addNewTrade = useCallback(async (newTrade) => {
    setTrades(prevTrades => ({
      ...prevTrades,
      [newTrade.trade_id]: newTrade,
    }));
  }, []);

  const addNewRelatedInstance = useCallback(async (newInstance) => {
    setRelatedInstancesState(prev => ({
      ...prev,
      [newInstance.instance_id]: newInstance.ownershipStatus,
    }));
  }, []);

  const proposeTrade = useCallback(
    async (tradeData) => {
      try {
        const { tradeId, relatedInstance } = await proposeTradeService(tradeData);
        const newTrade = { ...tradeData, trade_id: tradeId };
        await addNewTrade(newTrade);
        if (relatedInstance) {
          await addNewRelatedInstance(relatedInstance);
        }
        periodicUpdates();
        return { success: true, tradeId };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
    [periodicUpdates, addNewTrade, addNewRelatedInstance]
  );

  const setTradeData = useCallback(async (newTradesObj) => {
    try {
      const tradesArray = Object.keys(newTradesObj).map((tradeId) => {
        return { trade_id: tradeId, ...newTradesObj[tradeId] };
      });
      await setTradesinDB('pokemonTrades', tradesArray);
      setTrades(newTradesObj);
      return newTradesObj;
    } catch (err) {
      console.error('[setTradeData] ERROR:', err);
      throw err;
    }
  }, []);

  const setRelatedInstances = useCallback(async (newInstancesObj) => {
    try {
      const instancesArray = Object.keys(newInstancesObj).map((instanceId) => {
        return { instance_id: instanceId, ...newInstancesObj[instanceId] };
      });
      await setTradesinDB('relatedInstances', instancesArray);
      setRelatedInstancesState(newInstancesObj);
      return newInstancesObj;
    } catch (err) {
      console.error('[setRelatedInstances] ERROR:', err);
      throw err;
    }
  }, []);

  // Load trades and related instances from IndexedDB on mount
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

        console.log(trades, relatedInstances)
      } catch (error) {
        console.error('Error initializing TradeDataContext:', error);
      }
    }

    initializeTradeData();
    // Empty dependency array ensures this runs only once on mount
  }, [setTradeData, setRelatedInstances]);

  const contextValue = {
    proposeTrade,
    setTradeData,
    setRelatedInstances,
    trades,
    relatedInstances,
    addNewTrade,
    addNewRelatedInstance,
  };

  return (
    <TradeDataContext.Provider value={contextValue}>
      {children}
    </TradeDataContext.Provider>
  );
};
