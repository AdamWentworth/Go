import { searchContract } from '@pokemongonexus/shared-contracts/search';
import { runtimeConfig } from '../../../src/config/runtimeConfig';
import { searchPokemon } from '../../../src/services/searchService';

jest.mock('@pokemongonexus/shared-contracts/common', () => ({
  buildUrl: (base: string, path: string, query?: Record<string, unknown>) => {
    const qs = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) qs.append(key, String(value));
      });
    }
    const suffix = qs.toString();
    return `${base}${path}${suffix ? `?${suffix}` : ''}`;
  },
}));

const makeResponse = (status: number, body: unknown): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: async () => body,
  }) as Response;

describe('searchService', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('returns array payload for pokemon search', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      makeResponse(200, [{ pokemon_id: 25, distance: 1.2 }]),
    );

    const result = await searchPokemon({
      pokemon_id: 25,
      shiny: false,
      shadow: false,
      costume_id: null,
      fast_move_id: null,
      charged_move_1_id: null,
      charged_move_2_id: null,
      gender: null,
      background_id: null,
      attack_iv: null,
      defense_iv: null,
      stamina_iv: null,
      only_matching_trades: null,
      pref_lucky: null,
      friendship_level: null,
      already_registered: null,
      trade_in_wanted_list: null,
      latitude: 0,
      longitude: 0,
      ownership: 'caught',
      range_km: 100,
      limit: 25,
      dynamax: false,
      gigantamax: false,
    });

    expect(result).toEqual([{ pokemon_id: 25, distance: 1.2 }]);
    expect(fetchMock.mock.calls[0]?.[0]).toContain(
      `${runtimeConfig.api.searchApiUrl}${searchContract.endpoints.searchPokemon}`,
    );
  });
});

