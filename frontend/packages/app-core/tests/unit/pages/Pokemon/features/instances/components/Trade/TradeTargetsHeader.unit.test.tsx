import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import TradeTargetsHeader from '@/pages/Pokemon/features/instances/components/Trade/TradeTargetsHeader';
import type { PokemonInstance } from '@/types/pokemonInstance';

vi.mock('@/components/EditSaveComponent', () => ({
  default: ({ editMode }: { editMode: boolean }) => (
    <div data-testid="edit-save-component">{String(editMode)}</div>
  ),
}));

let lastMirrorManagerProps: unknown;

vi.mock('@/pages/Pokemon/features/instances/components/Trade/MirrorManager', () => ({
  default: (props: unknown) => {
    lastMirrorManagerProps = props;
    return <div data-testid="mirror-manager" />;
  },
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

describe('TradeTargetsHeader', () => {
  it('passes the actual edit mode into mirror manager', () => {
    lastMirrorManagerProps = undefined;
    render(<TradeTargetsHeader {...makeProps()} editMode={false} />);

    expect(lastMirrorManagerProps).toEqual(
      expect.objectContaining({ editMode: false }),
    );
  });

  it('renders trade top row controls without filter headings', () => {
    render(<TradeTargetsHeader {...makeProps()} />);

    expect(screen.getByTestId('edit-save-component')).toBeInTheDocument();
    expect(screen.getByTestId('mirror-manager')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Exclude' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Include' })).not.toBeInTheDocument();
  });

  it('keeps the same controls in few-layout mode', () => {
    render(<TradeTargetsHeader {...makeProps()} shouldShowFewLayout />);

    expect(screen.getByTestId('edit-save-component')).toBeInTheDocument();
    expect(screen.getByTestId('mirror-manager')).toBeInTheDocument();
  });

  it('does not render reset affordance in the header', () => {
    const mirrorProps = makeProps();
    const { rerender } = render(<TradeTargetsHeader {...mirrorProps} isMirror />);
    expect(screen.queryByAltText('Reset Filters')).not.toBeInTheDocument();

    const editableProps = makeProps();
    rerender(<TradeTargetsHeader {...editableProps} isMirror={false} editMode />);
    expect(screen.queryByAltText('Reset Filters')).not.toBeInTheDocument();
  });
});
