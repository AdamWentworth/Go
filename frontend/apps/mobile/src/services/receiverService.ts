import { receiverContract, type ReceiverBatchedUpdatesPayload } from '@pokemongonexus/shared-contracts/receiver';
import { runtimeConfig } from '../config/runtimeConfig';
import { requestJson } from './httpClient';

export type TradeBatchedUpdate = {
  operation: 'createTrade' | 'updateTrade' | 'deleteTrade';
  tradeData: Record<string, unknown>;
};

export type PokemonBatchedUpdate = {
  operation?: 'createPokemon' | 'updatePokemon' | 'deletePokemon' | string;
  [key: string]: unknown;
};

export const sendBatchedUpdates = async (
  payload: ReceiverBatchedUpdatesPayload<PokemonBatchedUpdate, TradeBatchedUpdate>,
): Promise<Record<string, unknown>> =>
  requestJson<Record<string, unknown>>(
    runtimeConfig.api.receiverApiUrl,
    receiverContract.endpoints.batchedUpdates,
    'POST',
    payload as unknown as Record<string, unknown>,
  );

export const sendTradeUpdate = async (
  tradeUpdate: TradeBatchedUpdate,
): Promise<Record<string, unknown>> =>
  sendBatchedUpdates({
    location: null,
    pokemonUpdates: [],
    tradeUpdates: [tradeUpdate],
  });

export const sendPokemonUpdate = async (
  pokemonUpdate: PokemonBatchedUpdate,
): Promise<Record<string, unknown>> =>
  sendBatchedUpdates({
    location: null,
    pokemonUpdates: [pokemonUpdate],
    tradeUpdates: [],
  });
