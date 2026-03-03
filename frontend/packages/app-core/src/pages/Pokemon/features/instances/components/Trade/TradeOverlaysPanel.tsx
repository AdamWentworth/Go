import React from 'react';

import type { Instances } from '@/types/instances';
import type { PokemonInstance } from '@/types/pokemonInstance';
import type { PokemonVariant } from '@/types/pokemonVariants';

import PokemonActionOverlay from './PokemonActionOverlay';
import TradeProposal from './TradeProposal';
import UpdateForTradeModal from './UpdateForTradeModal';
import type { SelectedPokemon, TradeProposalPayload } from './tradeDetailsHelpers';

interface TradeOverlaysPanelProps {
  isOverlayOpen: boolean;
  closeOverlay: () => void;
  handleViewWantedList: () => void;
  handleProposeTrade: () => void;
  selectedPokemon: SelectedPokemon | null;
  isTradeProposalOpen: boolean;
  pokemon: PokemonVariant & { instanceData: Partial<PokemonInstance> };
  tradeClickedPokemon: TradeProposalPayload | null;
  onCloseTradeProposal: () => void;
  myInstances: Instances | undefined;
  instancesMap: Record<string, PokemonInstance>;
  username: string;
  isUpdateForTradeModalOpen: boolean;
  caughtInstancesToTrade: PokemonInstance[];
  currentBaseKey: string | null;
  handleCancelTradeUpdate: () => void;
}

const TradeOverlaysPanel: React.FC<TradeOverlaysPanelProps> = ({
  isOverlayOpen,
  closeOverlay,
  handleViewWantedList,
  handleProposeTrade,
  selectedPokemon,
  isTradeProposalOpen,
  pokemon,
  tradeClickedPokemon,
  onCloseTradeProposal,
  myInstances,
  instancesMap,
  username,
  isUpdateForTradeModalOpen,
  caughtInstancesToTrade,
  currentBaseKey,
  handleCancelTradeUpdate,
}) => (
  <>
    <PokemonActionOverlay
      isOpen={isOverlayOpen}
      onClose={closeOverlay}
      onViewWantedList={handleViewWantedList}
      onProposeTrade={handleProposeTrade}
      pokemon={selectedPokemon}
    />

    {isTradeProposalOpen && (
      <TradeProposal
        passedInPokemon={pokemon as unknown as PokemonVariant & { instanceData?: PokemonInstance }}
        clickedPokemon={tradeClickedPokemon}
        wantedPokemon={selectedPokemon as unknown as { friendship_level?: number; pref_lucky?: boolean } | null}
        onClose={onCloseTradeProposal}
        myInstances={myInstances}
        instances={instancesMap}
        username={username}
      />
    )}

    {isUpdateForTradeModalOpen && (
      <UpdateForTradeModal
        caughtInstances={caughtInstancesToTrade}
        baseKey={currentBaseKey}
        onClose={handleCancelTradeUpdate}
      />
    )}
  </>
);

export default TradeOverlaysPanel;
