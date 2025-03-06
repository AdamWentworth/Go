// handleCompleteTrade.js
import { putBatchedTradeUpdates } from "../../../services/indexedDB";

export async function handleCompleteTrade({ 
  trade, 
  trades, 
  setTradeData, 
  periodicUpdates, 
  relatedInstances, 
  ownershipData, 
  setOwnershipData,
  currentUsername 
}) {
  // Determine which confirmation field to update based on the current user
  const isProposer = currentUsername === trade.username_proposed;
  const confirmationField = isProposer 
    ? 'user_proposed_completion_confirmed'
    : 'user_accepting_completion_confirmed';
  
  // Create an updated trade object
  const updatedTrade = {
    ...trade,
    [confirmationField]: true,  // Set the appropriate confirmation field
    last_update: Date.now(),
  };

  // Check if both users have confirmed
  const bothConfirmed = isProposer
    ? (updatedTrade.user_proposed_completion_confirmed && trade.user_accepting_completion_confirmed)
    : (trade.user_proposed_completion_confirmed && updatedTrade.user_accepting_completion_confirmed);

  // Only set completed status if both users have confirmed
  if (bothConfirmed) {
    updatedTrade.trade_status = 'completed';
    updatedTrade.trade_completed_date = new Date().toISOString();
    
    // Handle username swaps only when trade is fully completed
    const idProposed = trade.pokemon_instance_id_user_proposed;
    const idAccepting = trade.pokemon_instance_id_user_accepting;
    
    let instanceProposedData = relatedInstances[idProposed] || ownershipData[idProposed];
    let instanceAcceptingData = relatedInstances[idAccepting] || ownershipData[idAccepting];
    
    if (instanceProposedData && instanceAcceptingData) {
      instanceProposedData.username = trade.username_accepting;
      instanceAcceptingData.username = trade.username_proposed;
      
      const newDataForOwnership = {
        [idProposed]: instanceProposedData,
        [idAccepting]: instanceAcceptingData,
      };
      
      setOwnershipData(newDataForOwnership);
    }
  }

  // Update the trades collection
  const updatedTrades = { ...trades, [trade.trade_id]: updatedTrade };

  try {
    await setTradeData(updatedTrades);
    
    // Prepare batched update data
    const batchedUpdateData = {
      operation: 'updateTrade',
      tradeData: updatedTrade,
    };
    
    await putBatchedTradeUpdates(updatedTrade.trade_id, batchedUpdateData);
  } catch (error) {
    console.error("[handleCompleteTrade] Error updating trade:", error);
    throw error;
  }

  periodicUpdates();
  return updatedTrade;
}
