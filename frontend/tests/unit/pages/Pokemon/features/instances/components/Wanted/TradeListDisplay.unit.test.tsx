import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import TradeListDisplay from '@/pages/Pokemon/features/instances/components/Wanted/TradeListDisplay';
import useSortManager from '@/hooks/sort/useSortManager';

vi.mock('@/hooks/sort/useSortManager', () => ({
  default: vi.fn((items: unknown[]) => items),
}));

const useSortManagerMock = vi.mocked(useSortManager);

const buildProps = (
  overrides: Partial<React.ComponentProps<typeof TradeListDisplay>> = {},
): React.ComponentProps<typeof TradeListDisplay> => ({
  pokemon: { instanceData: { instance_id: 'variant-1_uuid-parent' } },
  lists: {
    trade: {
      'variant-2_uuid-1': {
        name: 'Charmander',
        species_name: 'Charmander',
        pokedex_number: 4,
        pokemon_id: 4,
        currentImage: '/images/charmander.png',
      },
    },
  },
  localNotTradeList: {},
  setLocalNotTradeList: vi.fn(),
  editMode: false,
  toggleReciprocalUpdates: vi.fn(),
  sortType: 'name' as const,
  sortMode: 'ascending' as const,
  onPokemonClick: vi.fn(),
  ...overrides,
});

describe('TradeListDisplay', () => {
  beforeEach(() => {
    useSortManagerMock.mockClear();
  });

  it('calls click handler with selected key when not in edit mode', () => {
    const props = buildProps();
    render(<TradeListDisplay {...props} />);

    fireEvent.click(screen.getByAltText('Trade Pokemon Charmander'));

    expect(props.onPokemonClick).toHaveBeenCalledWith('variant-2_uuid-1');
    expect(useSortManagerMock.mock.calls[0]).toHaveLength(3);
  });

  it('hides entries blocked by base key when not editing', () => {
    const props = buildProps({
      localNotTradeList: { 'variant-2': true },
    });
    render(<TradeListDisplay {...props} />);

    expect(screen.getByText('No Pokemon currently for trade.')).toBeInTheDocument();
  });

  it('allows toggle updates in edit mode', () => {
    const props = buildProps({ editMode: true });
    render(<TradeListDisplay {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'X' }));

    expect(props.setLocalNotTradeList).toHaveBeenCalled();
    expect(props.toggleReciprocalUpdates).toHaveBeenCalledWith(
      'variant-2_uuid-1',
      true,
    );
  });
});
