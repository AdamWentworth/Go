// handleCompleteTrade.js
import { putBatchedTradeUpdates } from "../../../services/indexedDB";

export async function handleCompleteTrade({ trade, trades, setTradeData, periodicUpdates, relatedInstances, ownershipData, setOwnershipData }) {

  // Create an updated trade object with accepted date and new status
  const updatedTrade = {
    ...trade,
    trade_completed_date: new Date().toISOString(), // Set completed date to current time
    trade_status: 'completed',                     // Update status to 'completed'
    last_update: Date.now(),
  };

  // Update the trades collection with the modified trade
  const updatedTrades = { ...trades, [trade.trade_id]: updatedTrade };

  // Persist the updated trades data using setTradeData
  try {
    await setTradeData(updatedTrades);
  } catch (error) {
    console.error("[handleCompleteTrade] Error persisting trade data:", error);
  }

  
  // --- New logic for handling username swaps and updating ownership data ---
  
  // 1. Extract instance IDs from the trade
  const idProposed = trade.pokemon_instance_id_user_proposed;
  const idAccepting = trade.pokemon_instance_id_user_accepting;
  
  // 2. Lookup instance data for both instances
  let instanceProposedData;
  let instanceAcceptingData;
  
  // Try to find the proposed instance first in relatedInstances, otherwise in ownershipData
  if (relatedInstances[idProposed]) {
    instanceProposedData = relatedInstances[idProposed];
  } else {
    instanceProposedData = ownershipData[idProposed];
  }
  
  // Similarly, find the accepting instance
  if (relatedInstances[idAccepting]) {
    instanceAcceptingData = relatedInstances[idAccepting];
  } else {
    instanceAcceptingData = ownershipData[idAccepting];
  }
  
  // 3. Swap usernames between the two instances if both were found
  if (instanceProposedData && instanceAcceptingData) {
    // Assign the proposed instance the username of the accepting user,
    // and vice versa.
    instanceProposedData.username = trade.username_accepting;
    instanceAcceptingData.username = trade.username_proposed;
  } else {
    console.warn("[handleCompleteTrade] One or both instances not found for swapping usernames.");
  }
  
  // 4. Prepare new data object for setOwnershipData using the updated instances
  const newDataForOwnership = {};
  if (instanceProposedData) newDataForOwnership[idProposed] = instanceProposedData;
  if (instanceAcceptingData) newDataForOwnership[idAccepting] = instanceAcceptingData;
  
  // 5. Call setOwnershipData with the newly prepared data
  setOwnershipData(newDataForOwnership);
  
  // Prepare batched update data
  const batchedUpdateData = {
    operation: 'updateTrade',
    tradeData: updatedTrade,
  };
  
  try {
    await putBatchedTradeUpdates(updatedTrade.trade_id, batchedUpdateData);
  } catch (error) {
    console.error("[handleCompleteTrade] Error in putBatchedTradeUpdates:", error);
  }
  
  periodicUpdates();
  console.log("[handleCompleteTrade] Completed.");
}
