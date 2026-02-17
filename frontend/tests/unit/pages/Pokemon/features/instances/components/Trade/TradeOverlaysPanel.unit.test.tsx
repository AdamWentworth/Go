import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import TradeOverlaysPanel from '@/pages/Pokemon/features/instances/components/Trade/TradeOverlaysPanel';
import type { PokemonInstance } from '@/types/pokemonInstance';

vi.mock('@/pages/Pokemon/features/instances/components/Trade/PokemonActionOverlay', () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="pokemon-action-overlay" /> : null,
}));

vi.mock('@/pages/Pokemon/features/instances/components/Trade/TradeProposal', () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <button type="button" data-testid="trade-proposal" onClick={onClose}>
      close trade proposal
    </button>
  ),
}));

vi.mock('@/pages/Pokemon/features/instances/components/Trade/UpdateForTradeModal', () => ({
  default: () => <div data-testid="update-for-trade-modal" />,
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

type TradeOverlaysPanelProps = React.ComponentProps<typeof TradeOverlaysPanel>;

const makeProps = (): TradeOverlaysPanelProps => ({
  isOverlayOpen: true,
  closeOverlay: vi.fn(),
  handleViewWantedList: vi.fn(),
  handleProposeTrade: vi.fn(),
  selectedPokemon: {
    key: '0001-default_uuid',
    name: 'Bulbasaur',
    species_name: 'Bulbasaur',
  },
  isTradeProposalOpen: false,
  pokemon: {
    variant_id: '0001-default',
    species_name: 'Bulbasaur',
    variantType: 'default',
    currentImage: '/img/1.png',
    instanceData: makeInstance(),
  } as unknown as TradeOverlaysPanelProps['pokemon'],
  tradeClickedPokemon: null,
  onCloseTradeProposal: vi.fn(),
  myInstances: { 'inst-1': makeInstance() },
  instancesMap: { 'inst-1': makeInstance() },
  username: 'ash',
  isUpdateForTradeModalOpen: false,
  caughtInstancesToTrade: [makeInstance()],
  currentBaseKey: '0001-default',
  handleCancelTradeUpdate: vi.fn(),
});

describe('TradeOverlaysPanel', () => {
  it('renders action overlay when open', () => {
    render(<TradeOverlaysPanel {...makeProps()} />);
    expect(screen.getByTestId('pokemon-action-overlay')).toBeInTheDocument();
    expect(screen.queryByTestId('trade-proposal')).not.toBeInTheDocument();
    expect(screen.queryByTestId('update-for-trade-modal')).not.toBeInTheDocument();
  });

  it('renders trade proposal and forwards close callback', () => {
    const props = makeProps();
    props.isTradeProposalOpen = true;
    props.tradeClickedPokemon = { matchedInstances: [] };

    render(<TradeOverlaysPanel {...props} />);
    fireEvent.click(screen.getByTestId('trade-proposal'));

    expect(props.onCloseTradeProposal).toHaveBeenCalledTimes(1);
  });

  it('renders update-for-trade modal when enabled', () => {
    const props = makeProps();
    props.isUpdateForTradeModalOpen = true;

    render(<TradeOverlaysPanel {...props} />);
    expect(screen.getByTestId('update-for-trade-modal')).toBeInTheDocument();
  });
});
