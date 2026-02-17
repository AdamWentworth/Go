import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import MirrorManager from '@/pages/Pokemon/features/instances/components/Trade/MirrorManager';
import { createMirrorEntry } from '@/pages/Pokemon/features/instances/utils/createMirrorEntry';

import type { PokemonInstance } from '@/types/pokemonInstance';

vi.mock('@/pages/Pokemon/features/instances/utils/createMirrorEntry', () => ({
  createMirrorEntry: vi.fn(),
}));

const createMirrorEntryMock = vi.mocked(createMirrorEntry);

const makeMirrorInstance = (overrides: Partial<PokemonInstance> = {}): PokemonInstance =>
  ({
    instance_id: 'mirror-1',
    variant_id: '0001-default',
    pokemon_id: 1,
    is_wanted: true,
    is_caught: false,
    is_for_trade: false,
    ...overrides,
  } as PokemonInstance);

const makePokemon = (mirror = true) => ({
  variant_id: '0001-default',
  pokemon_id: 1,
  species_name: 'Bulbasaur',
  name: 'Bulbasaur',
  variantType: 'default' as const,
  currentImage: '/images/bulbasaur.png',
  instanceData: {
    instance_id: 'source-1',
    mirror,
    variant_id: '0001-default',
  },
});

describe('MirrorManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reuses an existing wanted mirror instance for the same variant', async () => {
    const setIsMirror = vi.fn();
    const setMirrorKey = vi.fn();
    const updateDisplayedList = vi.fn();
    const updateDetails = vi.fn();

    render(
      <MirrorManager
        pokemon={makePokemon(true)}
        instances={{ 'mirror-1': makeMirrorInstance() }}
        lists={{ wanted: {} }}
        isMirror={true}
        setIsMirror={setIsMirror}
        setMirrorKey={setMirrorKey}
        editMode={true}
        updateDisplayedList={updateDisplayedList}
        updateDetails={updateDetails}
      />,
    );

    await waitFor(() => {
      expect(setMirrorKey).toHaveBeenCalledWith('mirror-1');
    });

    expect(createMirrorEntryMock).not.toHaveBeenCalled();
    expect(updateDisplayedList).toHaveBeenCalledWith(
      expect.objectContaining({
        'mirror-1': expect.objectContaining({
          instance_id: 'mirror-1',
          variant_id: '0001-default',
          name: 'Bulbasaur',
        }),
      }),
    );
  });

  it('creates a mirror entry when no existing wanted mirror matches', async () => {
    const setIsMirror = vi.fn();
    const setMirrorKey = vi.fn();
    const updateDisplayedList = vi.fn();
    const updateDetails = vi.fn();

    const instances: Record<string, PokemonInstance> = {};

    createMirrorEntryMock.mockImplementation((_pokemon, map) => {
      const instanceMap = map as Record<string, PokemonInstance>;
      instanceMap['new-mirror'] = makeMirrorInstance({ instance_id: 'new-mirror' });
      return 'new-mirror';
    });

    render(
      <MirrorManager
        pokemon={makePokemon(true)}
        instances={instances}
        lists={{ wanted: {} }}
        isMirror={true}
        setIsMirror={setIsMirror}
        setMirrorKey={setMirrorKey}
        editMode={true}
        updateDisplayedList={updateDisplayedList}
        updateDetails={updateDetails}
      />,
    );

    await waitFor(() => {
      expect(createMirrorEntryMock).toHaveBeenCalledTimes(1);
    });

    expect(setMirrorKey).toHaveBeenCalledWith('new-mirror');
    expect(updateDisplayedList).toHaveBeenCalledWith(
      expect.objectContaining({
        'new-mirror': expect.objectContaining({
          instance_id: 'new-mirror',
          is_wanted: true,
        }),
      }),
    );
  });

  it('toggles only when edit mode is enabled', async () => {
    const setIsMirror = vi.fn();
    const setMirrorKey = vi.fn();
    const updateDisplayedList = vi.fn();
    const updateDetails = vi.fn();

    const { rerender } = render(
      <MirrorManager
        pokemon={makePokemon(false)}
        instances={{}}
        lists={{ wanted: {} }}
        isMirror={false}
        setIsMirror={setIsMirror}
        setMirrorKey={setMirrorKey}
        editMode={true}
        updateDisplayedList={updateDisplayedList}
        updateDetails={updateDetails}
      />,
    );

    await waitFor(() => {
      expect(setIsMirror).toHaveBeenCalledWith(false);
    });

    setIsMirror.mockClear();

    fireEvent.click(screen.getByAltText('Mirror'));
    expect(setIsMirror).toHaveBeenCalledWith(true);

    setIsMirror.mockClear();

    rerender(
      <MirrorManager
        pokemon={makePokemon(false)}
        instances={{}}
        lists={{ wanted: {} }}
        isMirror={false}
        setIsMirror={setIsMirror}
        setMirrorKey={setMirrorKey}
        editMode={false}
        updateDisplayedList={updateDisplayedList}
        updateDetails={updateDetails}
      />,
    );

    fireEvent.click(screen.getByAltText('Mirror'));
    expect(setIsMirror).not.toHaveBeenCalled();
  });
});
