// handleCompleteTrade.ts

import { putBatchedTradeUpdates } from "../../../db/indexedDB";
import { createScopedLogger } from '@/utils/logger';
import type { TradeRecord } from '@shared-contracts/trades';

const log = createScopedLogger('handleCompleteTrade');

export type Trade = TradeRecord & {
  trade_id: string;
  username_proposed: string;
  username_accepting: string;
  trade_status: string;
  last_update: number;
  pokemon_instance_id_user_proposed: string;
  pokemon_instance_id_user_accepting: string;
};

export interface InstanceData {
  username: string;
  // Add any additional instance-specific properties as needed.
}

export interface HandleCompleteTradeArgs {
  trade: Trade;
  trades: Record<string, Trade>;
  setTradeData: (updatedTrades: Record<string, Trade>) => Promise<void>;
  periodicUpdates: () => void;
  relatedInstances: Record<string, InstanceData>;
  instances: Record<string, InstanceData>;
  setInstances?: (updatedData: Record<string, InstanceData>) => void;
  currentUsername: string;
}

/**
 * Handles completing a trade by updating the appropriate confirmation field,
 * swapping ownership of related instances if both parties confirm, and marking
 * the trade as completed with an updated timestamp.
 *
 * @param args HandleCompleteTradeArgs containing trade details and update callbacks.
 * @returns The updated trade object.
 */
export async function handleCompleteTrade({
  trade,
  trades,
  setTradeData,
  periodicUpdates,
  relatedInstances,
  instances,
  setInstances,
  currentUsername,
}: HandleCompleteTradeArgs): Promise<Trade> {
  const applyInstanceUpdates = setInstances;

  // Determine which confirmation field to update based on the current user.
  const isProposer = currentUsername === trade.username_proposed;
  const confirmationField = isProposer
    ? 'user_proposed_completion_confirmed'
    : 'user_accepting_completion_confirmed';

  // Create an updated trade object with the appropriate confirmation field set to true.
  const updatedTrade: Trade = {
    ...trade,
    [confirmationField]: true,
    last_update: Date.now(),
  };

  // Check if both users have confirmed.
  const bothConfirmed = isProposer
    ? (updatedTrade.user_proposed_completion_confirmed && trade.user_accepting_completion_confirmed)
    : (trade.user_proposed_completion_confirmed && updatedTrade.user_accepting_completion_confirmed);

  // If both users have confirmed, mark the trade as completed and update the completion date.
  if (bothConfirmed) {
    updatedTrade.trade_status = 'completed';
    updatedTrade.trade_completed_date = new Date().toISOString();

    // Handle username swaps when the trade is fully completed.
    const idProposed = trade.pokemon_instance_id_user_proposed;
    const idAccepting = trade.pokemon_instance_id_user_accepting;

    let instanceProposedData: InstanceData | undefined =
      relatedInstances[idProposed] || instances[idProposed];
    let instanceAcceptingData: InstanceData | undefined =
      relatedInstances[idAccepting] || instances[idAccepting];

    if (instanceProposedData && instanceAcceptingData) {
      // Swap the usernames.
      instanceProposedData = { ...instanceProposedData, username: trade.username_accepting };
      instanceAcceptingData = { ...instanceAcceptingData, username: trade.username_proposed };

      const newDataForOwnership: Record<string, InstanceData> = {
        [idProposed]: instanceProposedData,
        [idAccepting]: instanceAcceptingData,
      };

      applyInstanceUpdates?.(newDataForOwnership);
    }
  }

  // Update the trades collection.
  const updatedTrades: Record<string, Trade> = { ...trades, [trade.trade_id]: updatedTrade };

  try {
    await setTradeData(updatedTrades);

    // Prepare batched update data.
    const batchedUpdateData = {
      operation: 'updateTrade',
      tradeData: updatedTrade,
    };

    await putBatchedTradeUpdates(updatedTrade.trade_id, batchedUpdateData);
  } catch (error) {
    log.error('Error updating trade', error);
    throw error;
  }

  periodicUpdates();
  return updatedTrade;
}
