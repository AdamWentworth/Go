import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import TradeTargetsPanel from '@/pages/Pokemon/features/instances/components/Trade/TradeTargetsPanel';

const mocks = vi.hoisted(() => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
  updateInstanceDetailsMock: vi.fn(),
  alertMock: vi.fn(),
  buildWantedOverlayPokemonMock: vi.fn(),
  useTradeTargetFilteringMock: vi.fn(),
  useToggleEditModeTradeMock: vi.fn(),
  useTradeProposalFlowMock: vi.fn(),
}));

vi.mock('@/utils/logger', () => ({
  createScopedLogger: () => mocks.logger,
}));

vi.mock('@/features/instances/store/useInstancesStore', () => ({
  useInstancesStore: (
    selector: (state: { updateInstanceDetails: typeof mocks.updateInstanceDetailsMock }) => unknown,
  ) => selector({ updateInstanceDetails: mocks.updateInstanceDetailsMock }),
}));

vi.mock('@/contexts/ModalContext', () => ({
  useModal: () => ({
    alert: mocks.alertMock,
  }),
}));

vi.mock('@/pages/Pokemon/features/instances/components/Trade/TradeTargetsHeader', () => ({
  default: ({ filtersSlot }: { filtersSlot?: React.ReactNode }) => (
    <div data-testid="trade-top-row">{filtersSlot}</div>
  ),
}));

vi.mock('@/pages/Pokemon/features/instances/components/Trade/TradeTargetsList', () => ({
  default: ({ onPokemonClick }: { onPokemonClick: (key: string) => void }) => (
    <button
      type="button"
      data-testid="wanted-list-click"
      onClick={() => onPokemonClick('0001-default_uuid-1')}
    >
      click wanted
    </button>
  ),
}));

vi.mock('@/pages/Pokemon/features/instances/components/Trade/TradeOverlaysPanel', () => ({
  default: ({
    isOverlayOpen,
    selectedPokemon,
  }: {
    isOverlayOpen: boolean;
    selectedPokemon?: { key?: string } | null;
  }) => (
    <div data-testid="trade-overlays-panel">
      {isOverlayOpen ? `open:${selectedPokemon?.key ?? ''}` : 'closed'}
    </div>
  ),
}));

vi.mock('@/pages/Pokemon/features/instances/hooks/useTradeTargetFiltering', () => ({
  default: (...args: unknown[]) => mocks.useTradeTargetFilteringMock(...args),
}));

vi.mock('@/pages/Pokemon/features/instances/hooks/useToggleEditModeTrade', () => ({
  default: (...args: unknown[]) => mocks.useToggleEditModeTradeMock(...args),
}));

vi.mock('@/pages/Pokemon/features/instances/components/Trade/useTradeProposalFlow', () => ({
  default: (...args: unknown[]) => mocks.useTradeProposalFlowMock(...args),
}));

vi.mock('@/pages/Pokemon/features/instances/components/Trade/tradeTargetsHelpers', async () => {
  const actual =
    await vi.importActual<
      typeof import('@/pages/Pokemon/features/instances/components/Trade/tradeTargetsHelpers')
    >('@/pages/Pokemon/features/instances/components/Trade/tradeTargetsHelpers');
  return {
    ...actual,
    buildWantedOverlayPokemon: (...args: unknown[]) =>
      mocks.buildWantedOverlayPokemonMock(...args),
    initializeSelection: () => [],
  };
});

type TradeTargetsPanelProps = React.ComponentProps<typeof TradeTargetsPanel>;

const makeProps = (
  overrides: Partial<TradeTargetsPanelProps> = {},
): TradeTargetsPanelProps => ({
  pokemon: {
    variant_id: '0001-default',
    species_name: 'Bulbasaur',
    variantType: 'default',
    currentImage: '/images/bulbasaur.png',
    instanceData: {
      instance_id: '0001-default_uuid-parent',
      variant_id: '0001-default',
      pokemon_id: 1,
      is_caught: true,
      is_for_trade: true,
      is_wanted: false,
      not_wanted_list: {},
      wanted_filters: {},
      mirror: false,
    },
  } as TradeTargetsPanelProps['pokemon'],
  lists: {
    wanted: {
      '0001-default_uuid-1': {
        key: '0001-default_uuid-1',
        name: 'Bulbasaur',
      },
    },
  },
  instances: {
    '0001-default_uuid-1': {
      instance_id: '0001-default_uuid-1',
      variant_id: '0001-default',
      pokemon_id: 1,
      is_caught: true,
      is_for_trade: false,
      is_wanted: true,
    },
  } as unknown as TradeTargetsPanelProps['instances'],
  sortType: 'name',
  sortMode: 'ascending',
  openTradeTargetOverlay: vi.fn(),
  variants: [
    {
      variant_id: '0001-default',
      species_name: 'Bulbasaur',
      variantType: 'default',
      currentImage: '/images/bulbasaur.png',
      instanceData: {
        instance_id: '0001-default_uuid-1',
        variant_id: '0001-default',
        pokemon_id: 1,
        is_caught: true,
        is_for_trade: false,
        is_wanted: true,
      },
    },
  ] as TradeTargetsPanelProps['variants'],
  isEditable: true,
  username: 'ash',
  ...overrides,
});

describe('TradeTargetsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.useTradeTargetFilteringMock.mockReturnValue({
      filteredWantedList: {
        '0001-default_uuid-1': {
          key: '0001-default_uuid-1',
          name: 'Bulbasaur',
        },
      },
      filteredOutPokemon: [],
      updatedLocalWantedFilters: {},
    });

    mocks.useToggleEditModeTradeMock.mockReturnValue({
      editMode: false,
      toggleEditMode: vi.fn(),
    });

    mocks.useTradeProposalFlowMock.mockReturnValue({
      myInstances: {},
      isTradeProposalOpen: false,
      tradeClickedPokemon: null,
      isUpdateForTradeModalOpen: false,
      caughtInstancesToTrade: [],
      currentBaseKey: null,
      proposeTrade: vi.fn(async () => {}),
      closeTradeProposal: vi.fn(),
      closeTradeSelectionModal: vi.fn(),
    });

    mocks.buildWantedOverlayPokemonMock.mockReturnValue({
      ok: true,
      pokemon: {
        variant_id: '0001-default',
        ownershipStatus: {
          instance_id: '0001-default_uuid-1',
        },
      },
    });
  });

  it('opens wanted overlay when editable click resolves merged pokemon', () => {
    const props = makeProps({ isEditable: true });
    render(<TradeTargetsPanel {...props} />);

    fireEvent.click(screen.getByTestId('wanted-list-click'));

    expect(mocks.buildWantedOverlayPokemonMock).toHaveBeenCalledWith(
      '0001-default_uuid-1',
      props.variants,
      props.instances,
    );
    expect(props.openTradeTargetOverlay).toHaveBeenCalledWith(
      expect.objectContaining({
        variant_id: '0001-default',
      }),
    );
    expect(screen.getByTestId('trade-overlays-panel')).toHaveTextContent('closed');
  });

  it('logs and skips opening overlay when variant lookup fails', () => {
    mocks.buildWantedOverlayPokemonMock.mockReturnValue({
      ok: false,
      error: 'variantNotFound',
    });
    const props = makeProps();
    render(<TradeTargetsPanel {...props} />);

    fireEvent.click(screen.getByTestId('wanted-list-click'));

    expect(mocks.logger.error).toHaveBeenCalledWith(
      'Variant not found for instance id: 0001-default_uuid-1',
    );
    expect(props.openTradeTargetOverlay).not.toHaveBeenCalled();
  });

  it('logs and skips opening overlay when instance lookup fails', () => {
    mocks.buildWantedOverlayPokemonMock.mockReturnValue({
      ok: false,
      error: 'instanceNotFound',
    });
    const props = makeProps();
    render(<TradeTargetsPanel {...props} />);

    fireEvent.click(screen.getByTestId('wanted-list-click'));

    expect(mocks.logger.error).toHaveBeenCalledWith(
      'No instance data found for key: 0001-default_uuid-1',
    );
    expect(props.openTradeTargetOverlay).not.toHaveBeenCalled();
  });

  it('opens action overlay instead of wanted overlay when not editable', () => {
    const props = makeProps({ isEditable: false });
    render(<TradeTargetsPanel {...props} />);

    fireEvent.click(screen.getByTestId('wanted-list-click'));

    expect(props.openTradeTargetOverlay).not.toHaveBeenCalled();
    expect(screen.getByTestId('trade-overlays-panel')).toHaveTextContent(
      'open:0001-default_uuid-1',
    );
  });

  it('renders the trade target heading copy', () => {
    render(<TradeTargetsPanel {...makeProps()} />);

    expect(screen.getByText('Desired Return')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Trade Targets' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Choose the Pokemon you would accept for this trade and fine-tune the filters below.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Target List' })).toBeInTheDocument();
    expect(screen.getByText('1 visible')).toBeInTheDocument();
  });

  it('uses mirror-specific count copy when mirror mode is active', () => {
    render(
      <TradeTargetsPanel
        {...makeProps({
          pokemon: {
            ...makeProps().pokemon,
            instanceData: {
              ...makeProps().pokemon.instanceData,
              mirror: true,
            },
          } as TradeTargetsPanelProps['pokemon'],
        })}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Available Mirror' })).toBeInTheDocument();
    expect(screen.getByText('0 mirror targets')).toBeInTheDocument();
  });

  it('renders reset affordance in the target list header and only enables it in edit mode', () => {
    const editableProps = makeProps({ isEditable: true });
    const { rerender } = render(<TradeTargetsPanel {...editableProps} />);

    const reset = screen.getByAltText('Reset Filters');
    expect(reset).toBeInTheDocument();

    const readOnlyProps = makeProps({ isEditable: false });
    rerender(<TradeTargetsPanel {...readOnlyProps} />);
    expect(screen.queryByAltText('Reset Filters')).not.toBeInTheDocument();
  });
});
