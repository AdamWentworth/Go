import { pokemonContract } from '@pokemongonexus/shared-contracts/pokemon';
import { runtimeConfig } from '../../../src/config/runtimeConfig';
import { fetchPokemons } from '../../../src/services/pokemonService';

jest.mock('@pokemongonexus/shared-contracts/common', () => ({
  buildUrl: (base: string, path: string) => `${base}${path}`,
}));

const makeResponse = (status: number, body: unknown): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: async () => body,
  }) as Response;

describe('pokemonService', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('fetches pokemon payload from shared contract endpoint', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      makeResponse(200, [
        {
          pokemon_id: 25,
          name: 'Pikachu',
        },
      ]),
    );

    await fetchPokemons();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      `${runtimeConfig.api.pokemonApiUrl}${pokemonContract.endpoints.pokemons}`,
    );
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: 'GET',
    });
  });
});
