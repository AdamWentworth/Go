import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  generateUUID: vi.fn(),
  buildTagItem: vi.fn(),
}));

vi.mock('@/utils/PokemonIDUtils', () => ({
  generateUUID: mocks.generateUUID,
}));

vi.mock('@/features/tags/utils/tagHelpers', () => ({
  buildTagItem: mocks.buildTagItem,
}));

import { createMirrorEntry } from '@/pages/Pokemon/features/instances/utils/createMirrorEntry';

describe('createMirrorEntry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.generateUUID.mockReturnValue('99999999-9999-4999-8999-999999999999');
    mocks.buildTagItem.mockReturnValue({ kind: 'tag-item' });
  });

  it('creates mirror instance, updates wanted list, and persists both entries', () => {
    const instances: Record<string, any> = {};
    const lists: Record<string, any> = { wanted: {} };
    const updateDetails = vi.fn((id: string, data: any) => ({ id, data }));

    const pokemon = {
      variant_id: '0006-shiny-gigantamax',
      species_name: 'Charizard',
      currentImage: '/images/charizard.png',
      instanceData: {
        instance_id: 'current-instance-id',
        shiny: true,
      },
    };

    const newId = createMirrorEntry(pokemon, instances, lists, updateDetails);

    expect(newId).toBe('99999999-9999-4999-8999-999999999999');
    expect(instances[newId]).toMatchObject({
      instance_id: newId,
      variant_id: '0006-shiny_gigantamax',
      pokemon_id: 6,
      is_wanted: true,
      is_for_trade: false,
      mirror: true,
      registered: true,
    });

    expect(mocks.buildTagItem).toHaveBeenCalledWith(
      newId,
      expect.objectContaining({ instance_id: newId }),
      expect.objectContaining({ variant_id: '0006-shiny_gigantamax' }),
    );
    expect(lists.wanted[newId]).toEqual({ kind: 'tag-item' });

    expect(updateDetails).toHaveBeenNthCalledWith(
      1,
      newId,
      expect.objectContaining({ instance_id: newId }),
    );
    expect(updateDetails).toHaveBeenNthCalledWith(2, 'current-instance-id', {
      mirror: true,
    });
  });

  it('supports patch-map updateDetails signature when only one argument is accepted', () => {
    mocks.generateUUID.mockReturnValue('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

    const instances: Record<string, any> = {};
    const lists: Record<string, any> = { wanted: {} };
    const updateDetails = vi.fn((patch: Record<string, any>) => patch);

    const pokemon = {
      variant_id: '0025-default',
      name: 'Pikachu',
      instanceData: {},
    };

    const newId = createMirrorEntry(pokemon, instances, lists, updateDetails);

    expect(newId).toBe('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
    expect(updateDetails).toHaveBeenCalledTimes(1);
    expect(updateDetails).toHaveBeenCalledWith({
      [newId]: expect.objectContaining({
        instance_id: newId,
        variant_id: '0025-default',
        pokemon_id: 25,
      }),
    });
  });
});
