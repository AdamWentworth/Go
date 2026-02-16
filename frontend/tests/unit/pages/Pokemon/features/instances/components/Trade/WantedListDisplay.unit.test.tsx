import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import WantedListDisplay from '@/pages/Pokemon/features/instances/components/Trade/WantedListDisplay';
import useSortManager from '@/hooks/sort/useSortManager';

vi.mock('@/hooks/sort/useSortManager', () => ({
  default: vi.fn((items: unknown[]) => items),
}));

const useSortManagerMock = vi.mocked(useSortManager);

const buildProps = (
  overrides: Partial<React.ComponentProps<typeof WantedListDisplay>> = {},
): React.ComponentProps<typeof WantedListDisplay> => ({
  pokemon: { currentImage: '/images/fallback.png' },
  lists: {
    wanted: {
      'variant-1_uuid-1': {
        name: 'Bulbasaur',
        species_name: 'Bulbasaur',
        pokedex_number: 1,
        pokemon_id: 1,
        currentImage: '/images/bulbasaur.png',
      },
    },
  },
  localNotWantedList: {},
  setLocalNotWantedList: vi.fn(),
  isMirror: false,
  mirrorKey: null,
  editMode: false,
  toggleReciprocalUpdates: vi.fn(),
  sortType: 'name' as const,
  sortMode: 'ascending' as const,
  onPokemonClick: vi.fn(),
  ...overrides,
});

describe('WantedListDisplay', () => {
  beforeEach(() => {
    useSortManagerMock.mockClear();
  });

  it('calls click handler with selected key when not in edit mode', () => {
    const props = buildProps();
    render(<WantedListDisplay {...props} />);

    fireEvent.click(screen.getByAltText('Wanted Pokemon Bulbasaur'));

    expect(props.onPokemonClick).toHaveBeenCalledWith('variant-1_uuid-1');
    expect(useSortManagerMock.mock.calls[0]).toHaveLength(3);
  });

  it('hides locally excluded wanted entries when not editing', () => {
    const props = buildProps({
      localNotWantedList: { 'variant-1_uuid-1': true },
    });
    render(<WantedListDisplay {...props} />);

    expect(screen.getByText('No Pokemon currently wanted.')).toBeInTheDocument();
  });

  it('falls back to parent current image when item image is missing', () => {
    const props = buildProps({
      lists: {
        wanted: {
          'variant-2_uuid-2': {
            name: 'Ivysaur',
            pokedex_number: 2,
            pokemon_id: 2,
          },
        },
      },
    });

    render(<WantedListDisplay {...props} />);

    const image = screen.getByAltText('Wanted Pokemon Ivysaur') as HTMLImageElement;
    expect(image.src).toContain('/images/fallback.png');
  });
});
