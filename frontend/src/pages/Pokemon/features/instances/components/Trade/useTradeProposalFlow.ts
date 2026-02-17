import { useState } from 'react';

import { getAllInstances } from '@/db/instancesDB';
import { getAllFromTradesDB } from '@/db/tradesDB';
import type { Instances } from '@/types/instances';
import type { PokemonInstance } from '@/types/pokemonInstance';
import { parseVariantId } from '@/utils/PokemonIDUtils';
import { createScopedLogger } from '@/utils/logger';

import {
  prepareTradeCandidateSets,
  resolveTradeProposalDecision,
  type SelectedPokemon,
} from './tradeDetailsHelpers';

const log = createScopedLogger('useTradeProposalFlow');

type AlertFn = (message: string) => void | Promise<void>;

interface UseTradeProposalFlowParams {
  selectedPokemon: SelectedPokemon | null;
  closeOverlay: () => void;
  alert: AlertFn;
  fetchInstances?: () => Promise<PokemonInstance[]>;
  fetchTrades?: () => Promise<unknown[]>;
}

interface UseTradeProposalFlowResult {
  myInstances: Instances | undefined;
  isTradeProposalOpen: boolean;
  tradeClickedPokemon: Record<string, unknown> | null;
  isUpdateForTradeModalOpen: boolean;
  caughtInstancesToTrade: PokemonInstance[];
  currentBaseKey: string | null;
  proposeTrade: () => Promise<void>;
  closeTradeProposal: () => void;
  closeTradeSelectionModal: () => void;
}

const defaultFetchTrades = async (): Promise<unknown[]> => getAllFromTradesDB('pokemonTrades');

const useTradeProposalFlow = ({
  selectedPokemon,
  closeOverlay,
  alert,
  fetchInstances = getAllInstances,
  fetchTrades = defaultFetchTrades,
}: UseTradeProposalFlowParams): UseTradeProposalFlowResult => {
  const [myInstances, setMyInstances] = useState<Instances | undefined>();
  const [isTradeProposalOpen, setIsTradeProposalOpen] = useState(false);
  const [tradeClickedPokemon, setTradeClickedPokemon] = useState<Record<string, unknown> | null>(
    null,
  );
  const [isUpdateForTradeModalOpen, setIsUpdateForTradeModalOpen] = useState(false);
  const [caughtInstancesToTrade, setCaughtInstancesToTrade] = useState<PokemonInstance[]>([]);
  const [currentBaseKey, setCurrentBaseKey] = useState<string | null>(null);

  const proposeTrade = async () => {
    if (!selectedPokemon) {
      log.debug('No selectedPokemon. Aborting trade proposal.');
      return;
    }

    let userInstances: PokemonInstance[] = [];
    try {
      userInstances = await fetchInstances();
    } catch (error) {
      log.error('Failed to fetch user instances from IndexedDB:', error);
      await alert('Could not fetch your instances. Aborting trade proposal.');
      return;
    }

    const { selectedBaseKey, hashedInstances, caughtInstances, tradeableInstances } =
      prepareTradeCandidateSets(selectedPokemon, userInstances, parseVariantId);

    log.debug('Hashed ownership data prepared.', {
      count: Object.keys(hashedInstances).length,
    });
    log.debug('Caught instances after filter.', { count: caughtInstances.length });

    setMyInstances(hashedInstances);

    let decision: ReturnType<typeof resolveTradeProposalDecision>;
    if (tradeableInstances.length > 0) {
      try {
        const allTrades = await fetchTrades();
        decision = resolveTradeProposalDecision(
          selectedPokemon,
          selectedBaseKey,
          caughtInstances,
          tradeableInstances,
          allTrades,
        );
      } catch (error) {
        log.error('Failed to fetch or process trades data:', error);
        await alert('Could not verify trade availability. Please try again.');
        return;
      }
    } else {
      decision = resolveTradeProposalDecision(
        selectedPokemon,
        selectedBaseKey,
        caughtInstances,
        tradeableInstances,
        [],
      );
    }

    switch (decision.kind) {
      case 'noCaught':
        await alert('You do not have this Pokemon caught, so you cannot propose a trade.');
        return;
      case 'noAvailableTradeable':
        await alert(
          'All instances of this Pokemon are currently involved in pending trades. Catch some more of this Pokemon to offer this trade or cancel your current pending trade.',
        );
        return;
      case 'needsTradeSelection':
        setCaughtInstancesToTrade(decision.caughtInstances);
        setCurrentBaseKey(decision.selectedBaseKey);
        setIsUpdateForTradeModalOpen(true);
        return;
      case 'proposalReady':
        setTradeClickedPokemon(decision.payload);
        closeOverlay();
        setIsTradeProposalOpen(true);
        return;
    }
  };

  const closeTradeProposal = () => {
    setIsTradeProposalOpen(false);
    setTradeClickedPokemon(null);
  };

  const closeTradeSelectionModal = () => {
    setIsUpdateForTradeModalOpen(false);
  };

  return {
    myInstances,
    isTradeProposalOpen,
    tradeClickedPokemon,
    isUpdateForTradeModalOpen,
    caughtInstancesToTrade,
    currentBaseKey,
    proposeTrade,
    closeTradeProposal,
    closeTradeSelectionModal,
  };
};

export default useTradeProposalFlow;
