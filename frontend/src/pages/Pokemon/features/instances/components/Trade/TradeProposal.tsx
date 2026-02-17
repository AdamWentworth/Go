/* TradeProposal.jsx */

/* ------------------------------------------------------------------ */
/*  TradeProposal.tsx – fully-typed & squiggle-free                    */
/* ------------------------------------------------------------------ */

import React, { useEffect, useRef, useState } from 'react';
import './TradeProposal.css';

import CP from '@/components/pokemonComponents/CP';
import Moves from '@/components/pokemonComponents/Moves';
import LocationCaught from '@/components/pokemonComponents/LocationCaught';
import DateCaughtComponent from '@/components/pokemonComponents/DateCaught';

import FriendshipManager from '../Wanted/FriendshipManager';
import useCalculateStardustCost from '../../hooks/useCalculateStardustCost';

import { useTradeStore } from '@/features/trades/store/useTradeStore';
import { useModal } from '@/contexts/ModalContext';
import { createScopedLogger } from '@/utils/logger';

import type { PokemonVariant } from '@/types/pokemonVariants';
import type { PokemonInstance } from '@/types/pokemonInstance';
import type { Instances } from '@/types/instances';

const log = createScopedLogger('TradeProposal');

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Narrow a variant so TypeScript knows `instanceData` is present. */
const hasInstanceData = (
  p: PokemonVariant | null | undefined,
): p is PokemonVariant & { instanceData: PokemonInstance } =>
  !!p && !!p.instanceData;

/* ------------------------------------------------------------------ */
/* Component props                                                     */
/* ------------------------------------------------------------------ */
interface TradeProposalProps {
  passedInPokemon: PokemonVariant;
  clickedPokemon: PokemonVariant & { matchedInstances?: PokemonVariant[] };
  wantedPokemon?: { friendship_level?: number; pref_lucky?: boolean };
  onClose: () => void;
  myInstances: Instances;
  instances: Instances;
  username: string;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */
const TradeProposal: React.FC<TradeProposalProps> = ({
  passedInPokemon,
  clickedPokemon,
  wantedPokemon,
  onClose,
  myInstances,
  instances,
  username,
}) => {
  /* context, refs ------------------------------------------------- */
  const proposeTrade = useTradeStore((s) => s.proposeTrade);
  const { alert } = useModal();
  const containerRef = useRef<HTMLDivElement | null>(null);

  /* local state --------------------------------------------------- */
  const { matchedInstances = [] } = clickedPokemon;
  const [selectedMatchedInstance, setSelectedMatchedInstance] =
    useState<PokemonVariant | null>(matchedInstances[0] ?? null);

  const [friendship_level, setFriendshipLevel] = useState<number>(0);
  const [pref_lucky, setPrefLucky] = useState<boolean>(false);

  /* sync props → state ------------------------------------------- */
  useEffect(() => {
    if (wantedPokemon) {
      setFriendshipLevel(wantedPokemon.friendship_level ?? 0);
      setPrefLucky(wantedPokemon.pref_lucky ?? false);
    }
  }, [wantedPokemon]);

  useEffect(() => {
    if (matchedInstances.length) setSelectedMatchedInstance(matchedInstances[0]);
  }, [matchedInstances]);

  /* close on outside click --------------------------------------- */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  /* stardust hook ------------------------------------------------- */
  const { stardustCost, isSpecialTrade, isRegisteredTrade } =
  useCalculateStardustCost(
    friendship_level,
    passedInPokemon,
    selectedMatchedInstance?.instanceData ?? null,
    myInstances,
    instances,
  );

  const formattedStardustCost = stardustCost.toLocaleString();

  /* handlers ------------------------------------------------------ */
  const handleInstanceChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const id = e.target.value;
    const found = matchedInstances.find(
      (m) => m.instanceData?.instance_id === id,
    );
    setSelectedMatchedInstance(found ?? null);
  };

  const handleProposeTrade = async (): Promise<void> => {
    if (!hasInstanceData(selectedMatchedInstance)) {
      await alert('Please select which instance to trade.');
      return;
    }
    if (friendship_level < 1 || friendship_level > 4) {
      await alert('Please select a valid friendship level (1-4).');
      return;
    }

    /* my username from localStorage (may be null) */
    let username_proposed: string | null = null;
    try {
      const stored = localStorage.getItem('user');
      if (stored) username_proposed = JSON.parse(stored).username ?? null;
    } catch {
      /* ignore */ 
    }

    const tradeData = {
      username_proposed,
      username_accepting: username,
      pokemon_instance_id_user_proposed: selectedMatchedInstance.instanceData.instance_id,
      pokemon_instance_id_user_accepting:
        passedInPokemon.instanceData?.instance_id ??
        passedInPokemon.variant_id ??
        '',
      is_special_trade: isSpecialTrade,
      is_registered_trade: isRegisteredTrade,
      is_lucky_trade: pref_lucky,
      trade_dust_cost: stardustCost,
      trade_friendship_level: friendship_level,
      user_1_trade_satisfaction: null,
      user_2_trade_satisfaction: null,
      pokemon: passedInPokemon,
      trade_acceptance_date: null,
      trade_cancelled_by: null,
      trade_cancelled_date: null,
      trade_completed_date: null,
      trade_proposal_date: new Date().toISOString(),
      trade_status: 'proposed',
      last_update: Date.now(),
    };

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

  /* guard render -------------------------------------------------- */
  if (!passedInPokemon) return <p>Missing Pokémon data.</p>;

  /* shortcuts with instanceData fully defined -------------------- */
  const wantPoke = hasInstanceData(passedInPokemon) ? passedInPokemon : undefined;
  const matchPoke = hasInstanceData(selectedMatchedInstance) ? selectedMatchedInstance : undefined;

  /* render -------------------------------------------------------- */
  return (
    <div className="trade-proposal-overlay">
      <div className="trade-proposal-container" ref={containerRef}>
        {/* friendship / lucky manager */}
        <div className="friendship-manager">
          <FriendshipManager
            /* props required by its .d.ts – supply no-ops for unused ones */
            friendship={friendship_level}
            setFriendship={setFriendshipLevel as any}
            isLucky={pref_lucky}
            setIsLucky={setPrefLucky as any}
            /* the props you actually use */
            friendship_level={friendship_level}
            setFriendshipLevel={setFriendshipLevel}
            pref_lucky={pref_lucky}
            setPrefLucky={setPrefLucky}
            editMode
          />
        </div>

        {/* top row – the Pokémon we want */}
        <div className="trade-proposal-row trade-proposal-row-first">
          <div className="trade-proposal-details">
            {wantPoke && (
            <div className="pokemon-details">
              {wantPoke?.instanceData.nickname && (
                <p>Nickname: {wantPoke.instanceData.nickname}</p>
              )}
              <CP
                cp={wantPoke?.instanceData.cp ?? null}
                editMode={false}
                onCPChange={() => {}}
              />

                <Moves
                  pokemon={wantPoke}
                  editMode={false}
                  onMovesChange={() => {}}
                  isShadow={wantPoke.instanceData.shadow}
                  isPurified={wantPoke.instanceData.purified}
                />

                <LocationCaught
                  pokemon={wantPoke}
                  editMode={false}
                  onLocationChange={() => {}}
                />
              <DateCaughtComponent
                pokemon={wantPoke}
                editMode={false}
                onDateChange={() => {}}
              />
            </div>
            )}
          </div>

          <div className="trade-proposal-image-container">
            <div className="image-wrapper">
              {pref_lucky && (
                <img
                  src="/images/lucky.png"
                  alt="Lucky"
                  className="lucky-backdrop"
                />
              )}
              {wantPoke?.variantType.includes('dynamax') && (
                <img
                  src="/images/dynamax.png"
                  alt="Dynamax"
                  className="max-icon"
                />
              )}
              {wantPoke?.variantType.includes('gigantamax') && (
                <img
                  src="/images/gigantamax.png"
                  alt="G-max"
                  className="max-icon"
                />
              )}
              <img
                src={wantPoke?.currentImage ?? '/images/default/placeholder.png'}
                alt={wantPoke?.name}
                className="trade-proposal-pokemon-img"
              />
            </div>
            <h3 className="trade-proposal-name">{wantPoke?.name}</h3>
          </div>
        </div>

        {/* middle row – CTA + stardust */}
        <div className="trade-proposal-row trade-proposal-row-middle">
          <button
            className="trade-proposal-propose-button"
            onClick={handleProposeTrade}
            disabled={friendship_level === 0}
          >
            Propose Trade
          </button>

          <div className="trade-proposal-arrow">
            <img src="/images/pogo_trade_icon.png" alt="" className="trade-proposal-arrow-image" />
          </div>

          <div className="trade-proposal-stardust">
            <p>Stardust Cost: {formattedStardustCost}</p>
            <img src="/images/stardust.png" alt="" className="stardust-icon" />
            {isSpecialTrade && <p className="special-trade-warning">Special Trade!</p>}
          </div>
        </div>

        {/* bottom row – my matched instance(s) */}
        <div className="trade-proposal-row trade-proposal-row-bottom">
          <div className="trade-proposal-image-container">
            <div className="image-wrapper">
              {pref_lucky && (
                <img src="/images/lucky.png" alt="Lucky" className="lucky-backdrop" />
              )}
              {matchPoke?.variantType.includes('dynamax') && (
                <img src="/images/dynamax.png" alt="Dynamax" className="max-icon" />
              )}
              {matchPoke?.variantType.includes('gigantamax') && (
                <img src="/images/gigantamax.png" alt="G-max" className="max-icon" />
              )}
              <img
                src={matchPoke?.currentImage ?? '/images/default/placeholder.png'}
                alt={matchPoke?.name ?? 'Your Pokémon'}
                className="trade-proposal-pokemon-img"
              />
            </div>
            {matchPoke && (
              <h3 className="trade-proposal-name">{matchPoke.name}</h3>
            )}
          </div>

          {/* ---------- THIS ENTIRE DETAILS BLOCK IS REPLACED ---------- */}
          <div className="trade-proposal-details">
            {matchPoke && (
              <div className="pokemon-details">
                <CP
                  cp={matchPoke.instanceData.cp}
                  editMode={false}
                  onCPChange={() => {}}
                />

                <Moves
                  pokemon={matchPoke}
                  editMode={false}
                  onMovesChange={() => {}}
                  isShadow={matchPoke.instanceData.shadow}
                  isPurified={matchPoke.instanceData.purified}
                />

                {/* correct Pokémon passed here */}
                <LocationCaught
                  pokemon={matchPoke}
                  editMode={false}
                  onLocationChange={() => {}}
                />
                <DateCaughtComponent
                  pokemon={matchPoke}
                  editMode={false}
                  onDateChange={() => {}}
                />
              </div>
            )}

            {matchedInstances.length > 1 ? (
              <div className="trade-instance-picker">
                <label htmlFor="instance-selector">
                  Choose the instance to trade:
                </label>
                <select
                  id="instance-selector"
                  value={matchPoke?.instanceData.instance_id ?? ''}
                  onChange={handleInstanceChange}
                >
                  {matchedInstances.map((inst, idx) => (
                    <option
                      key={idx}
                      value={inst.instanceData?.instance_id ?? ''}
                    >
                      {inst.instanceData?.nickname ?? `${inst.name} ${idx + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              matchPoke?.instanceData.nickname && (
                <p>Nickname: {matchPoke.instanceData.nickname}</p>
              )
            )}
          </div>
          {/* ----------------------------------------------------------- */}
        </div>

      </div>
    </div>
  );
};

export default TradeProposal;
