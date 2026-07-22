import { useEffect, useMemo, useState } from 'react';
import { FaMinus, FaPlus, FaUndoAlt } from 'react-icons/fa';

import type { PokemonVariant } from '@/types/pokemonVariants';
import { resolveAssetUrl } from '@/utils/assetUrl';

import MaxRoleIcon from './MaxRoleIcon';
import {
  type MaxRankingEntry,
  type MaxRole,
  type MaxRoleCandidates,
} from '../utils/maxBattleModel';
import {
  getMaxBattleBossPreset,
  getMaxBattleTierOptions,
  MAX_BATTLE_EXECUTION_PRESETS,
  simulateMaxBattle,
  type MaxBattleExecution,
  type MaxBattleTier,
  type MaxBattleSimulationOutcome,
  type MaxBattleSimulationTeam,
} from '../utils/maxBattleSimulation';
import type { MaxRosterScope } from '../utils/maxRoster';

type MaxBattleSimulatorProps = {
  boss: PokemonVariant;
  candidates: MaxRoleCandidates;
  difficulty: MaxBattleTier;
  onDifficultyChange: (difficulty: MaxBattleTier) => void;
  onTrainerCountChange: (count: number) => void;
  rosterScope: MaxRosterScope;
  trainerCount: number;
};

type TeamSelection = Record<MaxRole, string>;

const MAX_ROLES: MaxRole[] = ['damage', 'tank', 'healing'];

const ROLE_LABELS: Record<MaxRole, string> = {
  damage: 'Damage',
  tank: 'Tank',
  healing: 'Healing',
};

const OUTCOME_COPY: Record<
  MaxBattleSimulationOutcome,
  { label: string; detail: string }
> = {
  'likely-clear': {
    label: 'Likely clear',
    detail: 'Useful time and survival reserve remain in this model.',
  },
  'close-call': {
    label: 'Close call',
    detail: 'Small execution, moveset, or teammate differences could decide it.',
  },
  unlikely: {
    label: 'More help needed',
    detail: 'The group runs out of damage or endurance before the limit.',
  },
};

const entryKey = (entry: MaxRankingEntry): string =>
  `${entry.variant.variant_id}::${entry.fastMove.move_id}::${entry.maxMoveType}`;

const recommendedSelection = (candidates: MaxRoleCandidates): TeamSelection => {
  const usedVariants = new Set<string>();
  const selection = { damage: '', tank: '', healing: '' };

  MAX_ROLES.forEach((role) => {
    const entry =
      candidates[role].find(
        (candidate) => !usedVariants.has(candidate.variant.variant_id),
      ) ?? candidates[role][0];

    if (entry) {
      selection[role] = entryKey(entry);
      usedVariants.add(entry.variant.variant_id);
    }
  });

  return selection;
};

const resolveTeam = (
  candidates: MaxRoleCandidates,
  selection: TeamSelection,
): MaxBattleSimulationTeam | null => {
  const damage =
    candidates.damage.find((entry) => entryKey(entry) === selection.damage) ??
    candidates.damage[0];
  const tank =
    candidates.tank.find((entry) => entryKey(entry) === selection.tank) ??
    candidates.tank[0];
  const healing =
    candidates.healing.find((entry) => entryKey(entry) === selection.healing) ??
    candidates.healing[0];

  return damage && tank && healing ? { damage, tank, healing } : null;
};

const formatDuration = (seconds: number): string => {
  if (!Number.isFinite(seconds)) return '—';
  const rounded = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(rounded / 60);
  const remainder = rounded % 60;
  return minutes > 0 ? `${minutes}m ${remainder}s` : `${remainder}s`;
};

const formatNumber = (value: number): string => Math.round(value).toLocaleString();

const MaxBattleSimulator = ({
  boss,
  candidates,
  difficulty,
  onDifficultyChange,
  onTrainerCountChange,
  rosterScope,
  trainerCount,
}: MaxBattleSimulatorProps) => {
  const preset = useMemo(
    () => getMaxBattleBossPreset(boss, difficulty),
    [boss, difficulty],
  );
  const difficultyOptions = useMemo(
    () =>
      getMaxBattleTierOptions(boss).map((tier) =>
        getMaxBattleBossPreset(boss, tier),
      ),
    [boss],
  );
  const defaults = useMemo(() => recommendedSelection(candidates), [candidates]);
  const [selection, setSelection] = useState<TeamSelection>(defaults);
  const [bossHp, setBossHp] = useState(preset.bossHp);
  const [execution, setExecution] = useState<MaxBattleExecution>('standard');

  useEffect(() => {
    setSelection(defaults);
  }, [boss.variant_id, defaults]);

  useEffect(() => {
    setBossHp(preset.bossHp);
  }, [boss.variant_id, preset.bossHp]);

  const team = useMemo(
    () => resolveTeam(candidates, selection),
    [candidates, selection],
  );
  const scenarioResults = useMemo(
    () =>
      team
        ? {
            standard: simulateMaxBattle({
              boss,
              bossHp,
              execution: 'standard',
              trainerCount,
              team,
              tier: difficulty,
            }),
            'stress-test': simulateMaxBattle({
              boss,
              bossHp,
              execution: 'stress-test',
              trainerCount,
              team,
              tier: difficulty,
            }),
          }
        : null,
    [boss, bossHp, difficulty, team, trainerCount],
  );
  const result = scenarioResults?.[execution] ?? null;

  const setBoundedTrainerCount = (value: number) => {
    onTrainerCountChange(
      Math.min(preset.maxTrainers, Math.max(1, Math.round(value))),
    );
  };

  const selectTeamMember = (role: MaxRole, key: string) => {
    setSelection((current) => ({ ...current, [role]: key }));
  };

  return (
    <section className="max-simulator" aria-labelledby="max-simulator-title">
      <header className="max-simulator-header">
        <div>
          <span>Recommended party</span>
          <h2 id="max-simulator-title">Can this group beat {boss.name}?</h2>
        </div>
        <strong>{preset.label}</strong>
      </header>

      {team && result ? (
        <>
          <div className="max-simulator-decision">
            <div
              aria-live="polite"
              className={`max-simulator-verdict max-simulator-verdict--${result.outcome}`}
            >
              <span>{OUTCOME_COPY[result.outcome].label}</span>
              <strong>
                {Math.round(result.damagePercent * 100)}% modeled damage ·{' '}
                {formatDuration(result.estimatedClearSeconds)} clear
              </strong>
              <p>{OUTCOME_COPY[result.outcome].detail}</p>
            </div>

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
              <small>Up to {preset.maxTrainers}</small>
            </div>
          </div>

          <div className="max-simulator-party" aria-label="Recommended three-Pokémon party">
            {MAX_ROLES.map((role) => {
              const entry = team[role];
              return (
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
                  <label>
                    <span>{ROLE_LABELS[role]}</span>
                    <select
                      aria-label={`${ROLE_LABELS[role]} team member`}
                      onChange={(event) => selectTeamMember(role, event.target.value)}
                      value={entryKey(entry)}
                    >
                      {candidates[role].map((candidate) => (
                        <option key={entryKey(candidate)} value={entryKey(candidate)}>
                          {candidate.displayName} · {candidate.fastMove.name}
                        </option>
                      ))}
                    </select>
                    <small>{entry.maxMoveName}</small>
                  </label>
                </article>
              );
            })}
          </div>

          <details className="max-simulator-advanced">
            <summary>
              <span>Advanced setup</span>
              <small>Boss HP and model details</small>
            </summary>
            <div className="max-simulator-advanced-body">
              <dl className="max-simulator-snapshot">
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
                  <dt>Charge plan</dt>
                  <dd>
                    {result.meterPlan.chargedMove
                      ? `${result.meterPlan.fastMove.name} + ${result.meterPlan.chargedMove.name}`
                      : `${result.meterPlan.fastMove.name} only`}
                  </dd>
                </div>
              </dl>
              {scenarioResults && (
                <div className="max-simulator-range" aria-label="Modeled outcome range">
                  <span>Outcome range</span>
                  <strong>
                    Standard: {OUTCOME_COPY[scenarioResults.standard.outcome].label},{' '}
                    {formatDuration(scenarioResults.standard.estimatedClearSeconds)}
                  </strong>
                  <strong>
                    Stress: {OUTCOME_COPY[scenarioResults['stress-test'].outcome].label},{' '}
                    {formatDuration(scenarioResults['stress-test'].estimatedClearSeconds)}
                  </strong>
                </div>
              )}
              <label className="max-simulator-execution">
                <span>Execution</span>
                <select
                  aria-label="Max Battle execution"
                  onChange={(event) =>
                    setExecution(event.target.value as MaxBattleExecution)
                  }
                  value={execution}
                >
                  {Object.entries(MAX_BATTLE_EXECUTION_PRESETS).map(
                    ([value, option]) => (
                      <option key={value} value={value}>
                        {option.label}
                      </option>
                    ),
                  )}
                </select>
                <small>{MAX_BATTLE_EXECUTION_PRESETS[execution].detail}</small>
              </label>
              {difficultyOptions.length > 1 && (
                <label className="max-simulator-difficulty">
                  <span>Battle difficulty</span>
                  <select
                    aria-label="Max Battle difficulty"
                    onChange={(event) =>
                      onDifficultyChange(event.target.value as MaxBattleTier)
                    }
                    value={difficulty}
                  >
                    {difficultyOptions.map((option) => (
                      <option key={option.tier} value={option.tier}>
                        {option.label} · {formatNumber(option.bossHp)} HP
                      </option>
                    ))}
                  </select>
                  <small>Use the tier shown at the Power Spot</small>
                </label>
              )}
              <label className="max-simulator-hp">
                <span>Boss HP estimate</span>
                <input
                  aria-label="Boss HP estimate"
                  inputMode="numeric"
                  min="1"
                  onChange={(event) =>
                    setBossHp(Math.max(1, Number(event.target.value) || 1))
                  }
                  step="1000"
                  type="number"
                  value={bossHp}
                />
                <small>Editable when an event uses different HP</small>
              </label>
              <button
                className="max-simulator-reset"
                onClick={() => {
                  setSelection(defaults);
                  setBossHp(preset.bossHp);
                  setExecution('standard');
                }}
                type="button"
              >
                <FaUndoAlt aria-hidden="true" />
                Reset recommendations
              </button>
              <div className="max-simulator-assumptions">
                <p>
                  Encounter profile:{' '}
                  {preset.sourceUrl ? (
                    <a href={preset.sourceUrl} rel="noreferrer" target="_blank">
                      {preset.sourceName || 'Catalog source'}
                    </a>
                  ) : (
                    <strong>
                      {preset.source === 'catalog'
                        ? preset.sourceName || 'Catalog profile'
                        : 'Estimated fallback'}
                    </strong>
                  )}
                  {preset.notes ? ` — ${preset.notes}` : ''}
                </p>
                <p>
                  {result.trainerCount} equivalent Trainers in {result.subgroupCount}{' '}
                  four-person subgroup{result.subgroupCount === 1 ? '' : 's'}, each
                  bringing the displayed party. Support actions are used when the
                  selected tier and unlocked moves justify them; remaining actions
                  attack.
                </p>
                <p>
                  The estimate compares Fast Move-only play with every legal charged
                  rotation under this tier's Max Meter rules. The selected plan reaches
                  each Max phase in about {formatDuration(result.meterPlan.meterSeconds)}.
                  It also uses per-boss damage, scheduled 15-second shared-meter orbs,
                  Max Move levels, three Max actions, and a
                  {formatDuration(preset.enrageSeconds)} enrage window. It excludes
                  cheering, Power Spot bonuses,
                  Max Mushrooms, and network latency.{' '}
                  {rosterScope === 'owned'
                    ? 'Other Trainers are modeled at the same strength as your selected trio.'
                    : 'Catalog entries use level 50, perfect IVs, and level-3 Max Moves.'}
                </p>
                <p>
                  Modeled damage before the limiting window:{' '}
                  {formatNumber(result.damageBeforeLimit)} / {formatNumber(result.bossHp)}
                  {' '}HP. The limiting window is{' '}
                  {formatDuration(result.limitingSeconds)} due to{' '}
                  {result.limitedBySurvival ? 'team endurance' : 'enrage'}.
                </p>
              </div>
            </div>
          </details>
        </>
      ) : (
        <div className="max-simulator-empty" role="status">
          <strong>A complete three-Pokémon party is required</strong>
          <span>Add eligible Damage, Tank, and Healing Pokémon to this roster.</span>
        </div>
      )}
    </section>
  );
};

export default MaxBattleSimulator;
