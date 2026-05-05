import React, { useEffect, useMemo, useRef, useState } from 'react';
import './TradeProposal.css';

import FriendshipManager from '../Wanted/FriendshipManager';
import useCalculateStardustCost from '../../hooks/useCalculateStardustCost';

import { useTradeStore } from '@/features/trades/store/useTradeStore';
import { useModal } from '@/contexts/ModalContext';
import { createScopedLogger } from '@/utils/logger';

import type { PokemonVariant } from '@/types/pokemonVariants';
import type { PokemonInstance } from '@/types/pokemonInstance';
import type { Instances } from '@/types/instances';
import type { TradeProposalPayload } from './tradeTargetsHelpers';
import {
  buildTradeProposalPreflight,
  buildTradeProposalRequest,
  findMatchedInstanceById,
  hasInstanceData,
  sanitizeInstanceData,
} from './tradeProposalHelpers';
import { getStoredUsername } from '@/utils/storage';
import {
  TradeProposalActionRow,
  TradeProposalMatchedDetails,
  TradeProposalPokemonCard,
  TradeProposalPokemonDetails,
} from './TradeProposalSections';

const log = createScopedLogger('TradeProposal');

interface TradeProposalProps {
  passedInPokemon: PokemonVariant & { instanceData?: PokemonInstance };
  clickedPokemon?: TradeProposalPayload | null;
  wantedPokemon?: { friendship_level?: number; pref_lucky?: boolean } | null;
  onClose: () => void;
  myInstances?: Instances;
  instances: Instances;
  username: string;
}

const TradeProposal: React.FC<TradeProposalProps> = ({
  passedInPokemon,
  clickedPokemon,
  wantedPokemon,
  onClose,
  myInstances,
  instances,
  username,
}) => {
  const proposeTrade = useTradeStore((s) => s.proposeTrade);
  const { alert } = useModal();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const matchedInstances = useMemo(
    () =>
      Array.isArray(clickedPokemon?.matchedInstances)
        ? clickedPokemon.matchedInstances
        : [],
    [clickedPokemon?.matchedInstances],
  );
  const [selectedMatchedInstance, setSelectedMatchedInstance] =
    useState<PokemonVariant | null>(matchedInstances[0] ?? null);

  const [friendship_level, setFriendshipLevel] = useState<number>(0);
  const [pref_lucky, setPrefLucky] = useState<boolean>(false);

  useEffect(() => {
    if (wantedPokemon) {
      setFriendshipLevel(wantedPokemon.friendship_level ?? 0);
      setPrefLucky(wantedPokemon.pref_lucky ?? false);
    }
  }, [wantedPokemon]);

  useEffect(() => {
    if (matchedInstances.length) setSelectedMatchedInstance(matchedInstances[0]);
  }, [matchedInstances]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const { stardustCost, isSpecialTrade, isRegisteredTrade } = useCalculateStardustCost(
    friendship_level,
    passedInPokemon,
    selectedMatchedInstance?.instanceData ?? null,
    myInstances ?? {},
    instances,
  );

  const formattedStardustCost = stardustCost.toLocaleString();

  const handleInstanceChange = (instanceId: string): void => {
    setSelectedMatchedInstance(findMatchedInstanceById(matchedInstances, instanceId));
  };

  const handleProposeTrade = async (): Promise<void> => {
    const username_proposed = getStoredUsername();
    const preflight = buildTradeProposalPreflight({
      selectedMatchedInstance,
      friendshipLevel: friendship_level,
      usernameProposed: username_proposed,
    });
    if (!preflight.ok) {
      await alert(preflight.error);
      return;
    }
    const proposedInstanceId = preflight.proposedInstanceId;
    const normalizedFriendshipLevel = friendship_level as 1 | 2 | 3 | 4;
    const sanitizedInstanceData = sanitizeInstanceData(passedInPokemon.instanceData);
    const tradeData = buildTradeProposalRequest({
      usernameProposed: preflight.usernameProposed,
      usernameAccepting: username,
      proposedInstanceId,
      acceptingInstanceId:
        passedInPokemon.instanceData?.instance_id ?? passedInPokemon.variant_id ?? '',
      isSpecialTrade,
      isRegisteredTrade,
      isLuckyTrade: pref_lucky,
      stardustCost,
      friendshipLevel: normalizedFriendshipLevel,
      variantId: passedInPokemon.variant_id,
      passedInInstanceId:
        typeof passedInPokemon.instanceData?.instance_id === 'string'
          ? passedInPokemon.instanceData.instance_id
          : undefined,
      sanitizedInstanceData,
    });

    try {
      const result = await proposeTrade(tradeData);
      if (!result.success) {
        await alert(
          result.error?.includes('already exists')
            ? 'This trade proposal already exists.'
            : 'Failed to create trade proposal. Please try again.',
        );
        return;
      }
      await alert('Trade proposal successfully created!');
      onClose();
    } catch (err) {
      log.error('Unexpected error while proposing trade:', err);
      await alert('An unexpected error occurred. Please try again.');
    }
  };

  if (!passedInPokemon) return <p>Missing Pokemon data.</p>;

  const wantPoke = hasInstanceData(passedInPokemon) ? passedInPokemon : undefined;
  const matchPoke = hasInstanceData(selectedMatchedInstance) ? selectedMatchedInstance : undefined;

  return (
    <div className="trade-proposal-overlay">
      <div className="trade-proposal-container" ref={containerRef}>
        {/* friendship / lucky manager */}
        <div className="friendship-manager">
          <FriendshipManager
            friendship={friendship_level}
            setFriendship={setFriendshipLevel}
            isLucky={pref_lucky}
            setIsLucky={setPrefLucky}
            friendship_level={friendship_level}
            setFriendshipLevel={setFriendshipLevel}
            pref_lucky={pref_lucky}
            setPrefLucky={setPrefLucky}
            editMode
          />
        </div>

        <div className="trade-proposal-row trade-proposal-row-first">
          <div className="trade-proposal-details">
            {wantPoke ? <TradeProposalPokemonDetails pokemon={wantPoke} showNickname /> : null}
          </div>

          <TradeProposalPokemonCard
            pokemon={wantPoke}
            prefLucky={pref_lucky}
            fallbackAlt="Wanted Pokemon"
          />
        </div>

        <TradeProposalActionRow
          disabled={friendship_level === 0}
          formattedStardustCost={formattedStardustCost}
          isSpecialTrade={isSpecialTrade}
          onProposeTrade={handleProposeTrade}
        />

        <div className="trade-proposal-row trade-proposal-row-bottom">
          <TradeProposalPokemonCard
            pokemon={matchPoke}
            prefLucky={pref_lucky}
            fallbackAlt="Your Pokemon"
          />

          <TradeProposalMatchedDetails
            pokemon={matchPoke}
            matchedInstances={matchedInstances}
            onInstanceChange={handleInstanceChange}
          />
        </div>

      </div>
    </div>
  );
};

export default TradeProposal;
