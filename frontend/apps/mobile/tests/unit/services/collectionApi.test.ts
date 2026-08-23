import { pokemonContract } from '@pokemongonexus/shared-contracts/pokemon';
import { usersContract } from '@pokemongonexus/shared-contracts/users';
import {
  getNativeCollectionSnapshot,
  getNativePokemonMoves,
  getReconciledNativeCollectionSnapshot,
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

  it('reconciles acknowledged batches and projects retained local snapshots', async () => {
    const canonicalInstance = { instance_id: 'instance-1', pokemon_id: 1, last_update: 100 };
    const localInstance = {
      ...canonicalInstance,
      variant_id: '1', nickname: null, cp: 501, level: null,
      attack_iv: null, defense_iv: null, stamina_iv: null,
      shiny: false, costume_id: null, lucky: false, shadow: false, purified: false,
      fast_move_id: null, charged_move1_id: null, charged_move2_id: null,
      weight: null, height: null, gender: null, mega: false, mega_form: null,
      is_mega: false, dynamax: false, gigantamax: false, crown: false,
      max_attack: null, max_guard: null, max_spirit: null, is_fused: false,
      fusion: null, fusion_form: null, fused_with: null, is_traded: false,
      traded_date: null, original_trainer_id: null, original_trainer_name: null,
      is_caught: true, is_for_trade: false, is_wanted: false, most_wanted: false,
      caught_tags: [], trade_tags: [], wanted_tags: [], not_trade_list: null,
      not_wanted_list: null, trade_filters: null, wanted_filters: null,
      mirror: false, pref_lucky: false, friendship_level: null, registered: true,
      favorite: false, disabled: false, pokeball: null, location_card: null,
      location_caught: null, date_caught: null, date_added: '2026-08-23T00:00:00Z',
      last_update: 200,
    };
    const retained = [{
      userId: 'user-1',
      batch: { sync_batch_id: 'batch-1', location: null, pokemonUpdates: [localInstance] },
      state: 'pending' as const,
      createdAt: 100, updatedAt: 100, attemptCount: 0,
      lastError: null, acknowledgedAt: null,
    }];
    const usersClient = { get: jest.fn().mockResolvedValue({ instances: {
      'instance-1': canonicalInstance,
    } }) };
    const pokemonClient = { get: jest.fn().mockResolvedValue([]) };
    const outbox = {
      list: jest.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(retained),
      removeAcknowledged: jest.fn().mockResolvedValue(undefined),
    };

    const snapshot = await getReconciledNativeCollectionSnapshot(
      usersClient, pokemonClient, outbox, 'user-1',
    );
    expect(snapshot.instances['instance-1']?.cp).toBe(501);
    expect(outbox.list).toHaveBeenNthCalledWith(1, 'user-1', 'acknowledged');
    expect(outbox.list).toHaveBeenNthCalledWith(2, 'user-1');
  });
});
