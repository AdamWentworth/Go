import { tradesContract } from '@pokemongonexus/shared-contracts/trades';
import { runtimeConfig } from '../../../src/config/runtimeConfig';
import { requestJson } from '../../../src/services/httpClient';
import { revealTradePartnerInfo } from '../../../src/services/tradePartnerService';

jest.mock('../../../src/services/httpClient', () => ({
  requestJson: jest.fn(),
}));

const mockedRequestJson = requestJson as jest.MockedFunction<typeof requestJson>;

describe('tradePartnerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls auth reveal-partner endpoint with shared contract path', async () => {
    mockedRequestJson.mockResolvedValue({
      trainerCode: '1111 2222 3333',
      pokemonGoName: 'Misty',
      location: 'Cerulean',
    });

    const trade = {
      trade_id: 't1',
      username_proposed: 'ash',
      username_accepting: 'misty',
    };

    const result = await revealTradePartnerInfo(trade);

    expect(mockedRequestJson).toHaveBeenCalledWith(
      runtimeConfig.api.authApiUrl,
      tradesContract.endpoints.revealPartnerInfo,
      'POST',
      { trade },
    );
    expect(result.pokemonGoName).toBe('Misty');
  });
});
