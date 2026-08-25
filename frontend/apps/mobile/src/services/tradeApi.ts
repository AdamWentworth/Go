import type {
  AuthoritativeTradeProposalRequest,
  TradeEnvelope,
  TradesEnvelope,
} from '@pokemongonexus/shared-contracts/trades';
import { tradesContract } from '@pokemongonexus/shared-contracts/trades';
import type { NativeUsersApiClient } from './nativeApiClients';

type NativeTradeClient = Pick<NativeUsersApiClient, 'get' | 'post'>;

const isRecord = (value: unknown): value is Record<string, unknown> => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const validateTradesEnvelope = (value: TradesEnvelope): TradesEnvelope => {
  if (!isRecord(value) || !Array.isArray(value.trades)) {
    throw new Error('The trades response is invalid.');
  }
  if (!isRecord(value.related_instances)) {
    throw new Error('The trades response contains invalid Pokémon data.');
  }
  if (value.trades.some((trade) => !isRecord(trade) || !trade.trade_id)) {
    throw new Error('The trades response contains an invalid trade.');
  }
  return value;
};

const validateTradeEnvelope = (value: TradeEnvelope): TradeEnvelope => {
  if (!isRecord(value) || !isRecord(value.trade) || !value.trade.trade_id) {
    throw new Error('The trade proposal response is invalid.');
  }
  if (!isRecord(value.affected_instances)) {
    throw new Error('The trade proposal response contains invalid Pokémon data.');
  }
  return value;
};

export const getNativeTrades = async (
  usersClient: Pick<NativeTradeClient, 'get'>,
): Promise<TradesEnvelope> => validateTradesEnvelope(
  await usersClient.get<TradesEnvelope>(tradesContract.endpoints.list),
);

export const createNativeTradeProposal = async (
  usersClient: Pick<NativeTradeClient, 'post'>,
  proposal: AuthoritativeTradeProposalRequest,
): Promise<TradeEnvelope> => validateTradeEnvelope(
  await usersClient.post<TradeEnvelope>(
    tradesContract.endpoints.create,
    proposal,
  ),
);
