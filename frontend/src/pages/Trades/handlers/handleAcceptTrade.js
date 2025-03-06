// handleAcceptTrade.js
import { putBatchedTradeUpdates } from "../../../services/indexedDB";

export async function handleAcceptTrade({ trade, trades, setTradeData, periodicUpdates }) {
  // 1. Create an updated trade object with accepted date and new status
  const updatedTrade = {
    ...trade,
    trade_accepted_date: new Date().toISOString(), // Set accepted date to current time
    trade_status: 'pending',                        // Update status to 'pending'
    last_update: Date.now(),
  };

  // 2. Clone existing trades and update the accepted trade
  const updatedTrades = { ...trades, [trade.trade_id]: updatedTrade };

  // 3. Identify Pokémon IDs from the accepted trade for reference
  const acceptedPokemonUserAccepting = updatedTrade.pokemon_instance_id_user_accepting;
  const acceptedPokemonUserProposed = updatedTrade.pokemon_instance_id_user_proposed;

  // 4. Find and mark other proposed trades containing the same Pokémon as deleted
  const tradesToDelete = [];
  for (const [id, t] of Object.entries(trades)) {
    // Skip the current accepted trade and only look at trades with status "proposed"
    if (id === updatedTrade.trade_id || t.trade_status !== 'proposed') continue;

    // Check if either Pokémon instance matches the ones in the accepted trade
    const involvesSamePokemon = 
      t.pokemon_instance_id_user_accepting === acceptedPokemonUserAccepting ||
      t.pokemon_instance_id_user_accepting === acceptedPokemonUserProposed ||
      t.pokemon_instance_id_user_proposed === acceptedPokemonUserAccepting ||
      t.pokemon_instance_id_user_proposed === acceptedPokemonUserProposed;

    if (involvesSamePokemon) {
      // Mark this conflicting trade as deleted
      const updatedDeleteTrade = {
        ...t,
        trade_status: 'deleted',
        trade_deleted_date: new Date().toISOString(),
        last_update: Date.now(),
      };

      // Update the trade in our collection and keep track for batched updates
      updatedTrades[id] = updatedDeleteTrade;
      tradesToDelete.push(updatedDeleteTrade);
    }
  }

  // 5. Persist all changes to the trades collection at once
  try {
    await setTradeData(updatedTrades);
  } catch (error) {
    console.error("[handleAcceptTrade] Error persisting trade data:", error);
    return;
  }

  // 6. Prepare batched updates for the accepted trade and all deleted trades
  const batchedUpdates = [];

  // Add update for accepted trade
  batchedUpdates.push({
    operation: 'updateTrade',
    tradeData: updatedTrade,
  });

  // Add updates for each deleted trade
  for (const deletedTrade of tradesToDelete) {
    batchedUpdates.push({
      operation: 'updateTrade',
      tradeData: deletedTrade,
    });
  }

  // 7. Execute all batched updates sequentially
  for (const update of batchedUpdates) {
    try {
      await putBatchedTradeUpdates(update.tradeData.trade_id, update);
    } catch (error) {
      console.error("[handleAcceptTrade] Error in putBatchedTradeUpdates:", error);
    }
  }

  // 8. Refresh periodic data and finish up
  periodicUpdates();
  console.log("[handleAcceptTrade] Completed.");
}
