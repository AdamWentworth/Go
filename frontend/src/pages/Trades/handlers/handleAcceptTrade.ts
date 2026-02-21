// handleAcceptTrade.ts

import { putBatchedTradeUpdates } from "../../../db/indexedDB";
import { createScopedLogger } from '@/utils/logger';
import type { TradeRecord } from '@shared-contracts/trades';

const log = createScopedLogger('handleAcceptTrade');

export type Trade = TradeRecord & {
  trade_id: string;
  trade_status: string;
  last_update: number;
  pokemon_instance_id_user_accepting: string;
  pokemon_instance_id_user_proposed: string;
};

export interface HandleAcceptTradeArgs {
  trade: Trade;
  trades: Record<string, Trade>;
  setTradeData: (updatedTrades: Record<string, Trade>) => Promise<void>;
  periodicUpdates: () => void;
}

/**
 * Handles acceptance of a trade by:
 * 1. Creating an updated trade object with the accepted date and new status.
 * 2. Marking other proposed trades involving the same Pokémon as deleted.
 * 3. Persisting all trade changes and preparing batched updates.
 * 4. Triggering periodic updates.
 *
 * @returns Promise that resolves when the processing is complete.
 */
export async function handleAcceptTrade({
  trade,
  trades,
  setTradeData,
  periodicUpdates,
}: HandleAcceptTradeArgs): Promise<void> {
  // 1. Create an updated trade object with accepted date and new status.
  const updatedTrade: Trade = {
    ...trade,
    trade_accepted_date: new Date().toISOString(),
    trade_status: 'pending',
    last_update: Date.now(),
  };

  // 2. Clone existing trades and update the accepted trade.
  const updatedTrades: Record<string, Trade> = { ...trades, [trade.trade_id]: updatedTrade };

  // 3. Identify Pokémon IDs from the accepted trade for reference.
  const acceptedPokemonUserAccepting = updatedTrade.pokemon_instance_id_user_accepting;
  const acceptedPokemonUserProposed = updatedTrade.pokemon_instance_id_user_proposed;

  // 4. Find and mark other proposed trades containing the same Pokémon as deleted.
  const tradesToDelete: Trade[] = [];
  for (const [id, t] of Object.entries(trades)) {
    // Skip the current accepted trade and only consider trades with status "proposed".
    if (id === updatedTrade.trade_id || t.trade_status !== 'proposed') continue;

    // Check if either Pokémon instance matches those in the accepted trade.
    const involvesSamePokemon =
      t.pokemon_instance_id_user_accepting === acceptedPokemonUserAccepting ||
      t.pokemon_instance_id_user_accepting === acceptedPokemonUserProposed ||
      t.pokemon_instance_id_user_proposed === acceptedPokemonUserAccepting ||
      t.pokemon_instance_id_user_proposed === acceptedPokemonUserProposed;

    if (involvesSamePokemon) {
      // Mark this conflicting trade as deleted.
      const updatedDeleteTrade: Trade = {
        ...t,
        trade_status: 'deleted',
        trade_deleted_date: new Date().toISOString(),
        last_update: Date.now(),
      };

      // Update the trade in our collection and keep track for batched updates.
      updatedTrades[id] = updatedDeleteTrade;
      tradesToDelete.push(updatedDeleteTrade);
    }
  }

  // 5. Persist all changes to the trades collection at once.
  try {
    await setTradeData(updatedTrades);
  } catch (error) {
    log.error('Error persisting trade data', error);
    return;
  }

  // 6. Prepare batched updates for the accepted trade and all deleted trades.
  const batchedUpdates: { operation: string; tradeData: Trade }[] = [];

  // Add update for accepted trade.
  batchedUpdates.push({
    operation: 'updateTrade',
    tradeData: updatedTrade,
  });

  // Add updates for each deleted trade.
  for (const deletedTrade of tradesToDelete) {
    batchedUpdates.push({
      operation: 'updateTrade',
      tradeData: deletedTrade,
    });
  }

  // 7. Execute all batched updates sequentially.
  for (const update of batchedUpdates) {
    try {
      await putBatchedTradeUpdates(update.tradeData.trade_id, update);
    } catch (error) {
      log.error('Error in putBatchedTradeUpdates', error);
    }
  }

  // 8. Refresh periodic data and finish up.
  periodicUpdates();
  log.debug('Completed');
}
