// proposeTrade.ts

import {
  TRADE_FRIENDSHIP_LEVELS,
  TRADE_STATUSES,
  getTradeByPokemonPair
} from '@/db/indexedDB';
import { generateUUID } from '@/utils/PokemonIDUtils';
import type {
  TradeProposalInstanceData,
  TradeProposalRequest,
  TradeRecord,
} from '@shared-contracts/trades';

type TradeData = TradeProposalRequest;

type TradeEntry = TradeRecord & {
  trade_id: string;
  username_proposed: string;
  username_accepting: string;
  pokemon_instance_id_user_proposed: string;
  pokemon_instance_id_user_accepting: string | null;
  is_special_trade: number;
  is_registered_trade: number;
  is_lucky_trade: number;
  trade_dust_cost: number;
  trade_friendship_level: string;
  trade_status: string;
  trade_proposal_date: string;
  last_update: number;
};

export async function proposeTrade(tradeData: TradeData): Promise<{
  tradeEntry: TradeEntry;
  relatedInstanceData: {
    instance_id: string;
  } & TradeProposalInstanceData;
}> {
  const {
    username_proposed,
    username_accepting,
    pokemon_instance_id_user_proposed,
    pokemon_instance_id_user_accepting = null,
    is_special_trade = false,
    is_registered_trade = false,
    trade_dust_cost = 0,
    is_lucky_trade = false,
    trade_friendship_level = 1,
    pokemon
  } = tradeData;

  if (!username_proposed || typeof username_proposed !== 'string') {
    throw new Error('Invalid or missing "username_proposed".');
  }

  if (!username_accepting || typeof username_accepting !== 'string') {
    throw new Error('Invalid or missing "username_accepting".');
  }

  if (!pokemon_instance_id_user_proposed || typeof pokemon_instance_id_user_proposed !== 'string') {
    throw new Error('Invalid or missing "pokemon_instance_id_user_proposed".');
  }

  if (pokemon_instance_id_user_accepting && typeof pokemon_instance_id_user_accepting !== 'string') {
    throw new Error('"pokemon_instance_id_user_accepting" must be a string or null.');
  }

  if (![1, 2, 3, 4].includes(trade_friendship_level)) {
    throw new Error('"trade_friendship_level" must be an integer between 1 and 4.');
  }

  if (!pokemon || typeof pokemon !== 'object') {
    throw new Error('Invalid or missing "pokemon" data.');
  }

  if (pokemon_instance_id_user_accepting) {
    const existingTrade = await getTradeByPokemonPair(
      pokemon_instance_id_user_proposed,
      pokemon_instance_id_user_accepting
    );
    if (existingTrade) {
      throw new Error('This trade proposal already exists.');
    }
  }

  const trade_id = `trade_${generateUUID()}`;

  const tradeEntry: TradeEntry = {
    trade_id,
    username_proposed,
    username_accepting,
    pokemon_instance_id_user_proposed,
    pokemon_instance_id_user_accepting,
    is_special_trade: is_special_trade ? 1 : 0,
    is_registered_trade: is_registered_trade ? 1 : 0,
    is_lucky_trade: is_lucky_trade ? 1 : 0,
    trade_dust_cost,
    trade_friendship_level: TRADE_FRIENDSHIP_LEVELS[trade_friendship_level],
    user_1_trade_satisfaction: null,
    user_2_trade_satisfaction: null,
    user_proposed_completion_confirmed: null,
    user_accepting_completion_confirmed: null,
    trade_status: TRADE_STATUSES.PROPOSED,
    trade_accepted_date: null,
    trade_proposal_date: new Date().toISOString(),
    trade_completed_date: null,
    trade_cancelled_date: null,
    trade_cancelled_by: null,
    last_update: Date.now(),
  };

  const relatedInstanceData = {
    instance_id:
      (pokemon.instanceData?.instance_id as string | undefined) ??
      pokemon.instance_id ??
      pokemon.variant_id ??
      '',
    ...(pokemon.instanceData ?? {}),
  };

  return {
    tradeEntry,
    relatedInstanceData
  };
}
