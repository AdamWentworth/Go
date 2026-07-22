import { useEffect, useMemo, useState } from 'react';
import { FaMinus, FaPlus } from 'react-icons/fa';

import type { PokemonVariant } from '@/types/pokemonVariants';
import { resolveAssetUrl } from '@/utils/assetUrl';

import MaxRoleIcon from './MaxRoleIcon';
import {
  getMaxBattleBossPreset,
  simulateMaxBattle,
  type MaxBattleSimulationOutcome,
  type MaxBattleSimulationTeam,
} from '../utils/maxBattleSimulation';
import type { MaxRosterScope } from '../utils/maxRoster';

type MaxBattleSimulatorProps = {
  boss: PokemonVariant;
  rosterScope: MaxRosterScope;
  team: MaxBattleSimulationTeam | null;
};

const OUTCOME_COPY: Record<
  MaxBattleSimulationOutcome,
  { label: string; detail: string }
> = {
  'likely-clear': {
    label: 'Likely clear',
    detail: 'The modeled lobby clears with useful time and survival reserve.',
  },
  'close-call': {
    label: 'Close call',
    detail: 'Small execution, moveset, or teammate differences could change the result.',
  },
  unlikely: {
    label: 'More help needed',
    detail: 'The modeled lobby runs out of damage or endurance before the limit.',
  },
};

const formatDuration = (seconds: number): string => {
  if (!Number.isFinite(seconds)) return '—';
  const rounded = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(rounded / 60);
  const remainder = rounded % 60;
  return minutes > 0 ? `${minutes}m ${remainder}s` : `${remainder}s`;
};

const formatNumber = (value: number): string =>
  Math.round(value).toLocaleString();

const MaxBattleSimulator = ({
  boss,
  rosterScope,
  team,
}: MaxBattleSimulatorProps) => {
  const preset = useMemo(() => getMaxBattleBossPreset(boss), [boss]);
  const [trainerCount, setTrainerCount] = useState(preset.defaultTrainers);
  const [bossHp, setBossHp] = useState(preset.bossHp);

  useEffect(() => {
    setTrainerCount(preset.defaultTrainers);
    setBossHp(preset.bossHp);
  }, [boss.variant_id, preset.bossHp, preset.defaultTrainers]);

  const result = useMemo(
    () =>
      team
        ? simulateMaxBattle({ boss, bossHp, trainerCount, team })
        : null,
    [boss, bossHp, team, trainerCount],
  );

  const setBoundedTrainerCount = (value: number) => {
    setTrainerCount(Math.min(preset.maxTrainers, Math.max(1, Math.round(value))));
  };

  return (
    <section className="max-simulator" aria-labelledby="max-simulator-title">
      <header className="max-simulator-header">
        <div>
          <span>Planning estimate</span>
          <h2 id="max-simulator-title">Can this group beat {boss.name}?</h2>
        </div>
        <strong>{preset.label}</strong>
      </header>

      <div className="max-simulator-controls">
        <div className="max-simulator-trainers">
          <span>Trainers</span>
          <div>
            <button
              aria-label="Remove one Trainer"
              disabled={trainerCount <= 1}
              onClick={() => setBoundedTrainerCount(trainerCount - 1)}
              title="Remove one Trainer"
              type="button"
            >
              <FaMinus aria-hidden="true" />
            </button>
            <input
              aria-label="Trainer count"
              inputMode="numeric"
              max={preset.maxTrainers}
              min="1"
              onChange={(event) =>
                setBoundedTrainerCount(Number(event.target.value) || 1)
              }
              type="number"
              value={trainerCount}
            />
            <button
              aria-label="Add one Trainer"
              disabled={trainerCount >= preset.maxTrainers}
              onClick={() => setBoundedTrainerCount(trainerCount + 1)}
              title="Add one Trainer"
              type="button"
            >
              <FaPlus aria-hidden="true" />
            </button>
          </div>
          <small>Maximum {preset.maxTrainers}</small>
        </div>

        <label className="max-simulator-hp">
          <span>Boss HP estimate</span>
          <input
            aria-label="Boss HP estimate"
            inputMode="numeric"
            min="1"
            onChange={(event) => setBossHp(Math.max(1, Number(event.target.value) || 1))}
            step="1000"
            type="number"
            value={bossHp}
          />
          <small>Editable when an event uses different HP</small>
        </label>
      </div>

      {team && result ? (
        <>
          <div className="max-simulator-party" aria-label="Recommended three-Pokémon party">
            {(
              [
                ['damage', team.damage],
                ['tank', team.tank],
                ['healing', team.healing],
              ] as const
            ).map(([role, entry]) => (
              <article key={role}>
                <span className={`max-simulator-role max-simulator-role--${role}`}>
                  <MaxRoleIcon role={role} />
                </span>
                <img
                  alt=""
                  draggable={false}
                  src={resolveAssetUrl(
                    entry.variant.currentImage || entry.variant.image_url || '',
                  )}
                />
                <div>
                  <small>{role}</small>
                  <strong>{entry.displayName}</strong>
                </div>
              </article>
            ))}
          </div>

          <div
            aria-live="polite"
            className={`max-simulator-result max-simulator-result--${result.outcome}`}
          >
            <div className="max-simulator-verdict">
              <span>{OUTCOME_COPY[result.outcome].label}</span>
              <strong>{Math.round(result.damagePercent * 100)}% modeled damage</strong>
              <p>{OUTCOME_COPY[result.outcome].detail}</p>
            </div>
            <dl>
              <div>
                <dt>Clear time</dt>
                <dd>{formatDuration(result.estimatedClearSeconds)}</dd>
              </div>
              <div>
                <dt>Lobby damage</dt>
                <dd>{result.lobbyDps.toFixed(1)}/s</dd>
              </div>
              <div>
                <dt>Max phases</dt>
                <dd>{result.estimatedMaxPhases}</dd>
              </div>
              <div>
                <dt>{result.limitedBySurvival ? 'Team endurance' : 'Enrage window'}</dt>
                <dd>{formatDuration(result.limitingSeconds)}</dd>
              </div>
            </dl>
          </div>

          <details className="max-simulator-assumptions">
            <summary>Simulation assumptions</summary>
            <p>
              {result.trainerCount} equivalent Trainers in {result.subgroupCount}{' '}
              four-person subgroup{result.subgroupCount === 1 ? '' : 's'}, each bringing
              the displayed three-Pokémon party. Every subgroup coordinates one Guard and
              one Spirit action per Max phase when unlocked; remaining actions attack.
            </p>
            <p>
              The estimate uses Fast Move cadence, per-boss damage, Max Move levels,
              three Max actions, and a six-minute enrage window. It excludes Max Meter
              orbs, cheering, Power Spot bonuses, Max Mushrooms, dodging, and network
              latency. {rosterScope === 'owned' ? 'Other Trainers are modeled at the same strength as your selected trio.' : 'Catalog entries use level 50, perfect IVs, and level-3 Max Moves.'}
            </p>
            <p>
              Modeled damage before the limiting window: {formatNumber(result.damageBeforeLimit)} /{' '}
              {formatNumber(result.bossHp)} HP.
            </p>
          </details>
        </>
      ) : (
        <div className="max-simulator-empty" role="status">
          <strong>A complete three-Pokémon party is required</strong>
          <span>
            Add eligible Max Attack, Max Guard, and Max Spirit Pokémon to this roster.
          </span>
        </div>
      )}
    </section>
  );
};

export default MaxBattleSimulator;
