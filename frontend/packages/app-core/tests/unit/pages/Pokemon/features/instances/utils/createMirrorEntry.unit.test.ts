import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  generateUUID: vi.fn(),
}));

vi.mock('@/utils/PokemonIDUtils', () => ({
  generateUUID: mocks.generateUUID,
}));

import {
  buildMirrorInstance,
  createMirrorEntry,
} from '@/pages/Pokemon/features/instances/utils/createMirrorEntry';

describe('createMirrorEntry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.generateUUID.mockReturnValue('99999999-9999-4999-8999-999999999999');
  });

  it('builds a wanted mirror instance without mutating or persisting caller state', () => {
    const pokemon = {
      variant_id: '0006-shiny-gigantamax',
      species_name: 'Charizard',
      currentImage: '/images/charizard.png',
      instanceData: {
        instance_id: 'current-instance-id',
        shiny: true,
      },
    };
    const instances: Record<string, Record<string, unknown>> = {};
    const lists: { wanted: Record<string, unknown> } = { wanted: {} };
    const updateDetails = vi.fn();

    const instance = createMirrorEntry(pokemon);

    expect(instance).toMatchObject({
      instance_id: '99999999-9999-4999-8999-999999999999',
      variant_id: '0006-shiny_gigantamax',
      pokemon_id: 6,
      is_wanted: true,
      is_for_trade: false,
      mirror: true,
      registered: true,
    });
    expect(instances).toEqual({});
    expect(lists).toEqual({ wanted: {} });
    expect(updateDetails).not.toHaveBeenCalled();
  });

  it('uses an explicit preview id when provided', () => {
    const pokemon = {
      variant_id: '0025-default',
      name: 'Pikachu',
      instanceData: {},
    };

    const instance = buildMirrorInstance(pokemon, 'preview-mirror-id');

    expect(instance).toEqual(
      expect.objectContaining({
        instance_id: 'preview-mirror-id',
        variant_id: '0025-default',
        pokemon_id: 25,
      }),
    );
    expect(mocks.generateUUID).not.toHaveBeenCalled();
  });
});
