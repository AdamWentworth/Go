import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import PokemonPageOverlays from '@/pages/Pokemon/components/PokemonPageOverlays';
import type { FusionSelectionData } from '@/types/fusion';
import type { InstanceStatus } from '@/types/instances';
import type { MegaSelectionData } from '@/pages/Pokemon/features/mega/hooks/useMegaPokemonHandler';

vi.mock('@/pages/Pokemon/components/Menus/PokemonMenu/HighlightActionButton', () => ({
  default: ({
    tagFilter,
    handleConfirmChangeTags,
  }: {
    tagFilter: string;
    handleConfirmChangeTags: (filter: InstanceStatus) => Promise<void>;
  }) => (
    <button
      data-testid="highlight-action"
      onClick={() => {
        void handleConfirmChangeTags('Trade');
      }}
    >
      highlight-{tagFilter}
    </button>
  ),
}));

vi.mock('@/components/CloseButton', () => ({
  default: ({ onClick }: { onClick: () => void }) => (
    <button data-testid="close-button" onClick={onClick}>
      close
    </button>
  ),
}));

vi.mock('@/components/ActionMenu', () => ({
  default: () => <div data-testid="action-menu">action menu</div>,
}));

vi.mock('@/pages/Pokemon/features/mega/components/MegaPokemonModal', () => ({
  default: ({
    open,
    onResolve,
    onReject,
  }: {
    open: boolean;
    onResolve: (option: string) => void;
    onReject: (reason?: unknown) => void;
  }) =>
    open ? (
      <div data-testid="mega-modal">
        <button data-testid="mega-resolve" onClick={() => onResolve('assignExisting')}>
          mega resolve
        </button>
        <button data-testid="mega-reject" onClick={() => onReject('cancelled')}>
          mega reject
        </button>
      </div>
    ) : null,
}));

vi.mock('@/pages/Pokemon/features/fusion/components/FusionPokemonModal', () => ({
  default: ({
    isOpen,
    onConfirm,
    onCancel,
    onCreateNewLeft,
    onCreateNewRight,
  }: {
    isOpen: boolean;
    onConfirm: (choice: string, leftId: string, rightId: string) => void;
    onCancel: () => void;
    onCreateNewLeft: () => void;
    onCreateNewRight: () => void;
  }) =>
    isOpen ? (
      <div data-testid="fusion-modal">
        <button data-testid="fusion-confirm" onClick={() => onConfirm('fuseThis', 'left', 'right')}>
          fusion confirm
        </button>
        <button data-testid="fusion-cancel" onClick={onCancel}>
          fusion cancel
        </button>
        <button data-testid="fusion-create-left" onClick={onCreateNewLeft}>
          fusion create left
        </button>
        <button data-testid="fusion-create-right" onClick={onCreateNewRight}>
          fusion create right
        </button>
      </div>
    ) : null,
}));

type Props = React.ComponentProps<typeof PokemonPageOverlays>;

const baseMegaSelectionData = {
  caughtPokemon: [],
  variantKey: '0001-default',
  megaForm: undefined,
  resolve: vi.fn(),
  reject: vi.fn(),
} as MegaSelectionData;

const baseFusionSelectionData = {
  baseKey: '0001-default',
  baseNumber: '0001',
  isShiny: false,
  fusionData: {} as FusionSelectionData['fusionData'],
  leftCandidatesList: [],
  rightCandidatesList: [],
  resolve: vi.fn(),
  reject: vi.fn(),
} as FusionSelectionData;

const makeProps = (overrides: Partial<Props> = {}): Props => ({
  isEditable: true,
  highlightedCards: new Set(['inst-1']),
  onConfirmChangeTags: vi.fn(async () => undefined),
  activeStatusFilter: 'Caught',
  isUpdating: false,
  showActionMenu: false,
  onActionMenuToggle: vi.fn(),
  isMegaSelectionOpen: false,
  megaSelectionData: null,
  onMegaResolve: vi.fn(),
  onMegaReject: vi.fn(),
  isFusionSelectionOpen: false,
  fusionSelectionData: null,
  onFusionResolve: vi.fn(),
  onFusionCancel: vi.fn(),
  onCreateNewLeft: vi.fn(),
  onCreateNewRight: vi.fn(),
  ...overrides,
});

describe('PokemonPageOverlays', () => {
  it('renders highlight action only for editable pages with highlighted cards', () => {
    const props = makeProps();
    const { rerender } = render(<PokemonPageOverlays {...props} />);

    expect(screen.getByTestId('highlight-action')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('highlight-action'));
    expect(props.onConfirmChangeTags).toHaveBeenCalledWith('Trade');

    rerender(
      <PokemonPageOverlays
        {...makeProps({
      isEditable: false,
      highlightedCards: new Set(),
        })}
      />,
    );
    expect(screen.queryByTestId('highlight-action')).not.toBeInTheDocument();
  });

  it('shows action menu overlay content and wires close callback', () => {
    const props = makeProps({ showActionMenu: true });
    render(<PokemonPageOverlays {...props} />);

    expect(screen.getByText('This is the action menu content.')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('close-button'));
    expect(props.onActionMenuToggle).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('action-menu')).toBeInTheDocument();
  });

  it('forwards mega and fusion modal actions when open', () => {
    const props = makeProps({
      isMegaSelectionOpen: true,
      megaSelectionData: baseMegaSelectionData,
      isFusionSelectionOpen: true,
      fusionSelectionData: baseFusionSelectionData,
    });

    render(<PokemonPageOverlays {...props} />);

    fireEvent.click(screen.getByTestId('mega-resolve'));
    fireEvent.click(screen.getByTestId('mega-reject'));
    fireEvent.click(screen.getByTestId('fusion-confirm'));
    fireEvent.click(screen.getByTestId('fusion-cancel'));
    fireEvent.click(screen.getByTestId('fusion-create-left'));
    fireEvent.click(screen.getByTestId('fusion-create-right'));

    expect(props.onMegaResolve).toHaveBeenCalledWith('assignExisting');
    expect(props.onMegaReject).toHaveBeenCalledWith('cancelled');
    expect(props.onFusionResolve).toHaveBeenCalledWith('fuseThis', 'left', 'right');
    expect(props.onFusionCancel).toHaveBeenCalledTimes(1);
    expect(props.onCreateNewLeft).toHaveBeenCalledTimes(1);
    expect(props.onCreateNewRight).toHaveBeenCalledTimes(1);
  });
});
