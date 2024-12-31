// TradeDataContext.js

import React, { createContext, useContext, useCallback } from 'react';
import { proposeTrade as proposeTradeService } from './TradeData/proposeTrade';
import { usePokemonData } from './PokemonDataContext';

// 1) Create the context
const TradeDataContext = createContext();

// 2) Export a hook to consume it
export const useTradeData = () => useContext(TradeDataContext);

// 3) Create the provider
export const TradeDataProvider = ({ children }) => {
  // We pull `periodicUpdates` from PokemonDataContext
  // This is the "bound" version that uses the shared scheduledSyncRef & timerRef
  const { periodicUpdates } = usePokemonData();

  const proposeTrade = useCallback(
    async (tradeData) => {
      // 1. Call the raw service function. This just does DB stuff.
      const tradeId = await proposeTradeService(tradeData);

      // 2. After that, we call the *context's* periodicUpdates, which uses the shared refs
      periodicUpdates();

      return tradeId;
    },
    [periodicUpdates]
  );

  // Other trade methods: acceptTrade, cancelTrade, etc.
  // each can do the same pattern: call service => periodicUpdates()

  const contextValue = {
    proposeTrade,
    // acceptTrade, cancelTrade, etc...
  };

  return (
    <TradeDataContext.Provider value={contextValue}>
      {children}
    </TradeDataContext.Provider>
  );
};
