import { pokemonContract } from '@pokemongonexus/shared-contracts/pokemon';
import { usersContract } from '@pokemongonexus/shared-contracts/users';
import {
  getNativeCollectionSnapshot,
  getNativePokemonMoves,
} from '../../../src/services/collectionApi';

describe('getNativeCollectionSnapshot', () => {
  it('loads canonical instances and the image-bearing catalog together', async () => {
    const instances = { 'instance-1': { pokemon_id: 1 } };
    const catalog = [{ pokemon_id: 1, name: 'Bulbasaur' }];
    const usersClient = {
      get: jest.fn().mockResolvedValue({
        checkpoint: 'checkpoint-1',
        not_modified: false,
        instances,
      }),
    };
    const pokemonClient = { get: jest.fn().mockResolvedValue(catalog) };

    await expect(
      getNativeCollectionSnapshot(usersClient, pokemonClient),
    ).resolves.toEqual({ instances, catalog });
    expect(usersClient.get).toHaveBeenCalledWith(usersContract.endpoints.instanceSync);
    expect(pokemonClient.get).toHaveBeenCalledWith(pokemonContract.endpoints.catalog);
  });

  it('loads move metadata lazily for native instance details', async () => {
    const moves = [{ pokemon_id: 6, moves: [] }];
    const pokemonClient = { get: jest.fn().mockResolvedValue(moves) };

    await expect(getNativePokemonMoves(pokemonClient)).resolves.toEqual(moves);
    expect(pokemonClient.get).toHaveBeenCalledWith(pokemonContract.endpoints.moves);
  });
});
