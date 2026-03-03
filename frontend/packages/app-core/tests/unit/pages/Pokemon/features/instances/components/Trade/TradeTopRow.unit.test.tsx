import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import TradeTopRow from '@/pages/Pokemon/features/instances/components/Trade/TradeTopRow';
import type { PokemonInstance } from '@/types/pokemonInstance';

vi.mock('@/components/EditSaveComponent', () => ({
  default: ({ editMode }: { editMode: boolean }) => (
    <div data-testid="edit-save-component">{String(editMode)}</div>
  ),
}));

vi.mock('@/pages/Pokemon/features/instances/components/Trade/MirrorManager', () => ({
  default: () => <div data-testid="mirror-manager" />,
}));

const makeInstance = (overrides: Partial<PokemonInstance> = {}): PokemonInstance =>
  ({
    instance_id: 'inst-1',
    variant_id: '0001-default',
    pokemon_id: 1,
    is_caught: true,
    is_for_trade: false,
    is_wanted: false,
    ...overrides,
  } as PokemonInstance);

const makeProps = () => ({
  isMirror: false,
  isEditable: true,
  editMode: true,
  shouldShowFewLayout: false,
  toggleEditMode: vi.fn(),
  onResetFilters: vi.fn(),
  pokemon: {
    species_name: 'Bulbasaur',
    instanceData: {
      instance_id: 'inst-1',
      mirror: false,
      variant_id: '0001-default',
    },
    variant_id: '0001-default',
  },
  instancesMap: { 'inst-1': makeInstance() },
  lists: { wanted: {} } as Record<string, Record<string, unknown>>,
  setIsMirror: vi.fn(),
  setMirrorKey: vi.fn(),
  updateMirrorDisplayedList: vi.fn(),
  updateDetails: vi.fn((_id: string, _patch: Partial<PokemonInstance>) => {}),
});

describe('TradeTopRow', () => {
  it('renders default headers and supporting controls', () => {
    render(<TradeTopRow {...makeProps()} />);

    expect(screen.getByRole('heading', { name: 'Exclude' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Include' })).toBeInTheDocument();
    expect(screen.getByTestId('edit-save-component')).toBeInTheDocument();
    expect(screen.getByTestId('mirror-manager')).toBeInTheDocument();
  });

  it('renders compact header mode with only Exclude', () => {
    render(<TradeTopRow {...makeProps()} shouldShowFewLayout />);

    expect(screen.getByRole('heading', { name: 'Exclude' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Include' })).not.toBeInTheDocument();
  });

  it('hides reset affordance in mirror mode and honors reset click only in edit mode', () => {
    const mirrorProps = makeProps();
    const { rerender } = render(<TradeTopRow {...mirrorProps} isMirror />);
    expect(screen.queryByAltText('Reset Filters')).not.toBeInTheDocument();

    const editableProps = makeProps();
    rerender(<TradeTopRow {...editableProps} isMirror={false} editMode />);
    const reset = screen.getByAltText('Reset Filters');
    fireEvent.click(reset);
    expect(editableProps.onResetFilters).toHaveBeenCalledTimes(1);

    const readOnlyProps = makeProps();
    rerender(<TradeTopRow {...readOnlyProps} isMirror={false} editMode={false} />);
    fireEvent.click(screen.getByAltText('Reset Filters'));
    expect(readOnlyProps.onResetFilters).not.toHaveBeenCalled();
  });
});
