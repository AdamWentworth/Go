import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import TradeDetails from '@/pages/Pokemon/features/instances/components/Trade/TradeDetails';

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
  useWantedFilteringMock: vi.fn(),
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

vi.mock('@/pages/Pokemon/features/instances/components/Trade/TradeTopRow', () => ({
  default: () => <div data-testid="trade-top-row" />,
}));

vi.mock('@/pages/Pokemon/features/instances/components/Trade/TradeFiltersPanel', () => ({
  default: () => <div data-testid="trade-filters-panel" />,
}));

vi.mock('@/pages/Pokemon/features/instances/components/Trade/WantedListDisplay', () => ({
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

vi.mock('@/pages/Pokemon/features/instances/hooks/useWantedFiltering', () => ({
  default: (...args: unknown[]) => mocks.useWantedFilteringMock(...args),
}));

vi.mock('@/pages/Pokemon/features/instances/hooks/useToggleEditModeTrade', () => ({
  default: (...args: unknown[]) => mocks.useToggleEditModeTradeMock(...args),
}));

vi.mock('@/pages/Pokemon/features/instances/components/Trade/useTradeProposalFlow', () => ({
  default: (...args: unknown[]) => mocks.useTradeProposalFlowMock(...args),
}));

vi.mock('@/pages/Pokemon/features/instances/components/Trade/tradeDetailsHelpers', async () => {
  const actual =
    await vi.importActual<
      typeof import('@/pages/Pokemon/features/instances/components/Trade/tradeDetailsHelpers')
    >('@/pages/Pokemon/features/instances/components/Trade/tradeDetailsHelpers');
  return {
    ...actual,
    buildWantedOverlayPokemon: (...args: unknown[]) =>
      mocks.buildWantedOverlayPokemonMock(...args),
    countVisibleWantedItems: () => 1,
    initializeSelection: () => [],
  };
});

type TradeDetailsProps = React.ComponentProps<typeof TradeDetails>;

const makeProps = (
  overrides: Partial<TradeDetailsProps> = {},
): TradeDetailsProps => ({
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
  } as TradeDetailsProps['pokemon'],
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
  } as unknown as TradeDetailsProps['instances'],
  sortType: 'name',
  sortMode: 'ascending',
  openWantedOverlay: vi.fn(),
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
  ] as TradeDetailsProps['variants'],
  isEditable: true,
  username: 'ash',
  ...overrides,
});

describe('TradeDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.useWantedFilteringMock.mockReturnValue({
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
    render(<TradeDetails {...props} />);

    fireEvent.click(screen.getByTestId('wanted-list-click'));

    expect(mocks.buildWantedOverlayPokemonMock).toHaveBeenCalledWith(
      '0001-default_uuid-1',
      props.variants,
      props.instances,
    );
    expect(props.openWantedOverlay).toHaveBeenCalledWith(
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
    render(<TradeDetails {...props} />);

    fireEvent.click(screen.getByTestId('wanted-list-click'));

    expect(mocks.logger.error).toHaveBeenCalledWith(
      'Variant not found for instance id: 0001-default_uuid-1',
    );
    expect(props.openWantedOverlay).not.toHaveBeenCalled();
  });

  it('logs and skips opening overlay when instance lookup fails', () => {
    mocks.buildWantedOverlayPokemonMock.mockReturnValue({
      ok: false,
      error: 'instanceNotFound',
    });
    const props = makeProps();
    render(<TradeDetails {...props} />);

    fireEvent.click(screen.getByTestId('wanted-list-click'));

    expect(mocks.logger.error).toHaveBeenCalledWith(
      'No instance data found for key: 0001-default_uuid-1',
    );
    expect(props.openWantedOverlay).not.toHaveBeenCalled();
  });

  it('opens action overlay instead of wanted overlay when not editable', () => {
    const props = makeProps({ isEditable: false });
    render(<TradeDetails {...props} />);

    fireEvent.click(screen.getByTestId('wanted-list-click'));

    expect(props.openWantedOverlay).not.toHaveBeenCalled();
    expect(screen.getByTestId('trade-overlays-panel')).toHaveTextContent(
      'open:0001-default_uuid-1',
    );
  });
});
