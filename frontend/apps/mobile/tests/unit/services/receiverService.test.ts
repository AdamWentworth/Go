import { receiverContract } from '@pokemongonexus/shared-contracts/receiver';
import { runtimeConfig } from '../../../src/config/runtimeConfig';
import {
  sendBatchedUpdates,
  sendPokemonUpdate,
  sendTradeUpdate,
} from '../../../src/services/receiverService';
import { requestJson } from '../../../src/services/httpClient';

jest.mock('../../../src/services/httpClient', () => ({
  requestJson: jest.fn(),
}));

const mockedRequestJson = requestJson as jest.MockedFunction<typeof requestJson>;

describe('receiverService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequestJson.mockResolvedValue({});
  });

  it('posts batched updates to receiver endpoint', async () => {
    const payload = {
      location: null,
      pokemonUpdates: [{ operation: 'updatePokemon' as const, pokemonData: { id: 'p1' } }],
      tradeUpdates: [{ operation: 'updateTrade' as const, tradeData: { trade_id: 't1' } }],
    };

    await sendBatchedUpdates(payload);

    expect(mockedRequestJson).toHaveBeenCalledWith(
      runtimeConfig.api.receiverApiUrl,
      receiverContract.endpoints.batchedUpdates,
      'POST',
      payload,
    );
  });

  it('wraps trade updates in batched payload', async () => {
    const tradeUpdate = {
      operation: 'updateTrade' as const,
      tradeData: { trade_id: 't9', trade_status: 'pending' },
    };

    await sendTradeUpdate(tradeUpdate);

    expect(mockedRequestJson).toHaveBeenCalledWith(
      runtimeConfig.api.receiverApiUrl,
      receiverContract.endpoints.batchedUpdates,
      'POST',
      {
        location: null,
        pokemonUpdates: [],
        tradeUpdates: [tradeUpdate],
      },
    );
  });

  it('wraps pokemon updates in batched payload', async () => {
    const pokemonUpdate = {
      operation: 'updatePokemon' as const,
      key: 'i1',
      pokemon_id: 25,
      is_caught: true,
    };

    await sendPokemonUpdate(pokemonUpdate);

    expect(mockedRequestJson).toHaveBeenCalledWith(
      runtimeConfig.api.receiverApiUrl,
      receiverContract.endpoints.batchedUpdates,
      'POST',
      {
        location: null,
        pokemonUpdates: [pokemonUpdate],
        tradeUpdates: [],
      },
    );
  });
});
