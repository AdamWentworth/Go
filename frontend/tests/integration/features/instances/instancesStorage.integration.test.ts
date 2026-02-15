import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import * as idb from '@/db/indexedDB';
import { initializeOrUpdateInstancesData } from '@/features/instances/storage/instancesStorage';

import type { PokemonVariant } from '@/types/pokemonVariants';

import { enableLogging, testLogger } from '../setupTests';

function makeVariant(overrides: Partial<PokemonVariant> = {}): PokemonVariant {
  return {
    variant_id: '0001-default',
    pokemon_id: 1,
    species_name: 'Bulbasaur',
    variantType: 'default',
    currentImage: '/images/default/pokemon_1.png',
    costumes: [],
    ...overrides,
  } as PokemonVariant;
}

describe.sequential('instancesStorage Integration', () => {
  beforeAll(() => {
    enableLogging('verbose');
    testLogger.fileStart('Instances');
    testLogger.suiteStart('instancesStorage initialization tests');
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();

    vi.spyOn(idb, 'getAllInstances').mockResolvedValue([]);
    vi.spyOn(idb, 'putInstancesBulk').mockResolvedValue(undefined);
  });

  it('creates one instance per missing variant when cache is empty', async () => {
    const variants = [makeVariant(), makeVariant({ variant_id: '0002-default', pokemon_id: 2 })];

    const instances = await initializeOrUpdateInstancesData([], variants);

    expect(Object.keys(instances)).toHaveLength(2);
    expect(idb.putInstancesBulk).toHaveBeenCalled();
    expect(localStorage.getItem('ownershipTimestamp')).not.toBeNull();
  });

  it('does not rewrite store when all variants are already present', async () => {
    vi.spyOn(idb, 'getAllInstances').mockResolvedValue([
      { instance_id: 'existing-1', variant_id: '0001-default', pokemon_id: 1 },
    ]);

    const variants = [makeVariant()];
    const out = await initializeOrUpdateInstancesData([], variants);

    expect(Object.keys(out)).toContain('existing-1');
    expect(idb.putInstancesBulk).not.toHaveBeenCalled();
  });

  it('throws a stable error when IndexedDB read fails', async () => {
    vi.spyOn(idb, 'getAllInstances').mockRejectedValue(new Error('indexeddb fail'));

    await expect(
      initializeOrUpdateInstancesData([], [makeVariant()]),
    ).rejects.toThrow('Failed to update instances data');
  });
});
