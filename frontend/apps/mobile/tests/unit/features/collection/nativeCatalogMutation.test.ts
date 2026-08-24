import type { BasePokemon } from '@pokemongonexus/shared-contracts/pokemon';
import type { PokemonCatalogEntry } from '@pokemongonexus/shared-domain/catalog';
import {
  createNativeInstanceFromCatalogEntry,
  persistNativeCatalogAddition,
} from '../../../../src/features/collection/nativeCatalogMutation';

const pokemon = {
  pokemon_id: 6,
  name: 'Charizard',
  pokedex_number: 6,
  costumes: [],
  megaEvolutions: [],
  fusion: [],
  crownForms: [],
} as unknown as BasePokemon;

const entry = (patch: Partial<PokemonCatalogEntry> = {}): PokemonCatalogEntry => ({
  id: '0006-shiny_dynamax',
  pokemonId: 6,
  pokedexNumber: 6,
  name: 'Shiny Dynamax Charizard',
  imageUri: '/images/charizard.png',
  typeIconUris: [],
  maxKind: 'dynamax',
  ...patch,
});

const outboxStore = () => ({
  queue: jest.fn().mockResolvedValue(undefined),
  list: jest.fn().mockResolvedValue([]),
  markAttemptFailed: jest.fn().mockResolvedValue(undefined),
  markAcknowledged: jest.fn().mockResolvedValue(undefined),
  removeAcknowledged: jest.fn().mockResolvedValue(undefined),
});

describe('native catalog additions', () => {
  it.each([
    ['caught', { is_caught: true, is_for_trade: false, is_wanted: false }],
    ['trade', { is_caught: true, is_for_trade: true, is_wanted: false }],
    ['wanted', { is_caught: false, is_for_trade: false, is_wanted: true }],
  ] as const)('creates a complete %s instance snapshot', (destination, flags) => {
    const instance = createNativeInstanceFromCatalogEntry({
      entry: entry(),
      pokemon,
      destination,
      instanceId: 'instance-1',
      now: 100,
    });
    expect(instance).toEqual(expect.objectContaining({
      instance_id: 'instance-1',
      variant_id: '0006-shiny_dynamax',
      pokemon_id: 6,
      shiny: true,
      dynamax: true,
      registered: true,
      ...flags,
    }));
  });

  it('preserves canonical tradeability rules for Shadow catalog entries', () => {
    expect(() => createNativeInstanceFromCatalogEntry({
      entry: entry({ id: '0006-shadow', name: 'Shadow Charizard', maxKind: null }),
      pokemon,
      destination: 'trade',
      instanceId: 'instance-1',
    })).toThrow('Shadow Pokémon cannot be added to For Trade');
  });

  it('queues the complete instance before sending it to Receiver', async () => {
    const outbox = outboxStore();
    const created = createNativeInstanceFromCatalogEntry({
      entry: entry(), pokemon, destination: 'caught', instanceId: 'instance-1', now: 100,
    });
    outbox.list.mockResolvedValueOnce([{
      userId: 'user-1',
      batch: { sync_batch_id: 'batch-1', location: null, pokemonUpdates: [created] },
      state: 'pending', createdAt: 100, updatedAt: 100,
      attemptCount: 0, lastError: null, acknowledgedAt: null,
    }]);
    const receiverClient = { post: jest.fn().mockResolvedValue({ message: 'accepted' }) };
    const onQueued = jest.fn();

    const result = await persistNativeCatalogAddition({
      userId: 'user-1',
      snapshot: { instances: {}, catalog: [pokemon] },
      entry: entry(),
      destination: 'caught',
      outbox,
      receiverClient,
      onQueued,
      instanceId: 'instance-1',
      syncBatchId: 'batch-1',
      now: 100,
    });

    expect(outbox.queue.mock.invocationCallOrder[0]).toBeLessThan(
      receiverClient.post.mock.invocationCallOrder[0] ?? Number.POSITIVE_INFINITY,
    );
    expect(onQueued).toHaveBeenCalledWith(expect.objectContaining({ instance_id: 'instance-1' }));
    expect(result.syncState).toBe('acknowledged');
  });
});
