import {
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import {
  FaBolt,
  FaCheckCircle,
  FaClock,
  FaExchangeAlt,
  FaFlask,
  FaHeartbeat,
  FaMinusCircle,
  FaPlay,
  FaSearch,
  FaShieldAlt,
  FaTimesCircle,
  FaTrophy,
  FaUsers,
} from 'react-icons/fa';

import { resolveAssetUrl } from '@/utils/assetUrl';
import { getTypeIconPath } from '@/utils/imageHelpers';
import type {
  PokemonPvPBattleMechanics,
  PokemonPvPBattleResponse,
} from '@shared-contracts/pokemon';

import {
  buildPvPBattleFighter,
  getPvPBattleCandidateLabel,
  isPvPBattleCandidateReady,
} from '../utils/pvpBattleLab';
import {
  buildRepresentativePvPMetaTeams,
  type PvPRepresentativeMetaTeam,
  type PvPTeamCandidate,
} from '../utils/pvpTeamBuilder';
import {
  simulatePvPBattleAsync,
  simulatePvPTeamBattleAsync,
  simulatePvPTeamGauntletAsync,
} from '../utils/pvpWorkers';
import { pvpBattleMechanicsLabel } from '../utils/pvpBattleMechanics';
import type {
  PvPTeamBattleResponse,
  PvPTeamGauntletResponse,
  PvPTeamSwitchPolicy,
} from '../utils/pvpWorkerProtocol';

const PICK_LIMIT = 12;
const TEAM_SLOT_LABELS = ['Lead', 'Safe Swap', 'Closer'] as const;

type BattleMode = 'single' | 'team';
type TeamKeys = [string, string, string];

const buildInitialTeamKeys = (
  candidates: PvPTeamCandidate[],
  preferred: readonly string[] = [],
): TeamKeys => {
  const available = new Set(candidates.map((candidate) => candidate.key));
  const keys = [...preferred, ...candidates.map((candidate) => candidate.key)]
    .filter((key, index, allKeys) =>
      Boolean(key) &&
      available.has(key) &&
      allKeys.indexOf(key) === index)
    .slice(0, 3);
  while (keys.length < 3) keys.push('');
  return keys as TeamKeys;
};

const searchableText = (candidate: PvPTeamCandidate): string =>
  [
    candidate.entry.name,
    candidate.nickname ?? '',
    candidate.entry.speciesId,
    ...candidate.entry.types,
    ...candidate.entry.moveset.map((move) => move.name),
  ]
    .join(' ')
    .toLowerCase();

function CandidatePicker({
  side,
  candidates,
  selected,
  onSelect,
}: {
  side: string;
  candidates: PvPTeamCandidate[];
  selected: PvPTeamCandidate | undefined;
  onSelect: (candidate: PvPTeamCandidate) => void;
}) {
  const [query, setQuery] = useState('');
  const matches = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return candidates
      .filter((candidate) => !normalized || searchableText(candidate).includes(normalized))
      .slice(0, PICK_LIMIT);
  }, [candidates, query]);

  return (
    <section className="pvp-battle-picker">
      <header>
        <span>{side}</span>
        {selected && (
          <strong>{getPvPBattleCandidateLabel(selected)}</strong>
        )}
      </header>
      <label>
        <FaSearch aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Find a Pokemon"
          aria-label={`Find ${side} Pokemon`}
        />
      </label>
      <div>
        {matches.map((candidate) => {
          const active = candidate.key === selected?.key;
          return (
            <button
              type="button"
              key={candidate.key}
              className={active ? 'active' : ''}
              aria-pressed={active}
              onClick={() => onSelect(candidate)}
            >
              <img
                src={resolveAssetUrl(candidate.entry.imageUrl)}
                alt=""
                draggable={false}
              />
              <span>
                <strong>{getPvPBattleCandidateLabel(candidate)}</strong>
                {candidate.nickname && <small>{candidate.entry.name}</small>}
                <small>
                  Level {candidate.entry.recommendedLevel}
                  {candidate.cp != null ? ` · CP ${candidate.cp.toLocaleString()}` : ''}
                </small>
              </span>
            </button>
          );
        })}
      </div>
      {matches.length === 0 && <small>No Pokemon match that search.</small>}
    </section>
  );
}

function TeamLineupEditor({
  side,
  candidates,
  selectedKeys,
  candidateByKey,
  onChange,
}: {
  side: string;
  candidates: PvPTeamCandidate[];
  selectedKeys: TeamKeys;
  candidateByKey: Map<string, PvPTeamCandidate>;
  onChange: (index: number, candidate: PvPTeamCandidate) => void;
}) {
  const [activeSlot, setActiveSlot] = useState(0);
  const selected = selectedKeys.map((key) => candidateByKey.get(key));
  const unavailableKeys = new Set(
    selectedKeys.filter((_, index) => index !== activeSlot),
  );
  const pickerCandidates = candidates.filter(
    (candidate) =>
      candidate.key === selectedKeys[activeSlot] ||
      !unavailableKeys.has(candidate.key),
  );

  return (
    <section className="pvp-team-lineup-editor">
      <header>
        <FaUsers aria-hidden="true" />
        <span>
          <strong>{side}</strong>
          <small>Lead, Safe Swap, and Closer</small>
        </span>
      </header>
      <div className="pvp-team-lineup-slots">
        {TEAM_SLOT_LABELS.map((label, index) => {
          const candidate = selected[index];
          const active = activeSlot === index;
          return (
            <button
              type="button"
              key={label}
              className={active ? 'active' : ''}
              aria-pressed={active}
              aria-label={`Edit ${side} ${label}${candidate
                ? `: ${getPvPBattleCandidateLabel(candidate)}`
                : ''}`}
              onClick={() => setActiveSlot(index)}
            >
              <small>{label}</small>
              {candidate ? (
                <>
                  <img
                    src={resolveAssetUrl(candidate.entry.imageUrl)}
                    alt=""
                    draggable={false}
                  />
                  <strong>{getPvPBattleCandidateLabel(candidate)}</strong>
                </>
              ) : (
                <span>Choose</span>
              )}
            </button>
          );
        })}
      </div>
      <CandidatePicker
        side={`Choose ${TEAM_SLOT_LABELS[activeSlot]}`}
        candidates={pickerCandidates}
        selected={selected[activeSlot]}
        onSelect={(candidate) => onChange(activeSlot, candidate)}
      />
    </section>
  );
}

function BattleBuild({ candidate }: { candidate: PvPTeamCandidate | undefined }) {
  if (!candidate) {
    return <div className="pvp-battle-build pvp-battle-build--empty">Choose a Pokemon</div>;
  }
  return (
    <div className="pvp-battle-build">
      <img src={resolveAssetUrl(candidate.entry.imageUrl)} alt="" draggable={false} />
      <span>
        <strong>{getPvPBattleCandidateLabel(candidate)}</strong>
        {candidate.nickname && <small>{candidate.entry.name}</small>}
        <small>
          Level {candidate.entry.recommendedLevel} ·{' '}
          {candidate.entry.attackIv}/{candidate.entry.defenseIv}/{candidate.entry.staminaIv} IV
        </small>
      </span>
      <div>
        {candidate.entry.moveset.map((move) => (
          <span key={`${move.kind}-${move.id}`}>
            <img src={getTypeIconPath(move.type)} alt="" draggable={false} />
            {move.name}
          </span>
        ))}
      </div>
    </div>
  );
}

function ShieldControl({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
}) {
  return (
    <fieldset className="pvp-battle-shields">
      <legend><FaShieldAlt aria-hidden="true" /> {label} shields</legend>
      <div>
        {[0, 1, 2].map((option) => (
          <button
            type="button"
            key={option}
            className={value === option ? 'active' : ''}
            aria-pressed={value === option}
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function EnergyControl({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
}) {
  return (
    <label className="pvp-battle-energy">
      <span><FaBolt aria-hidden="true" /> {label} energy <strong>{value}</strong></span>
      <input
        type="range"
        min="0"
        max="100"
        step="5"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function BattleResult({
  result,
  candidates,
}: {
  result: PokemonPvPBattleResponse;
  candidates: [PvPTeamCandidate, PvPTeamCandidate];
}) {
  const winner =
    result.winner < 0 ? null : candidates[result.winner];
  const keyEvents = result.timeline
    .filter((event) => event.kind === 'charged' || event.shielded || event.buffed)
    .slice(0, 14);

  return (
    <section className="pvp-battle-result" aria-live="polite">
      <header>
        <FaFlask aria-hidden="true" />
        <span>
          <small>Simulated result</small>
          <h2>
            {winner ? `${getPvPBattleCandidateLabel(winner)} wins` : 'Battle ends in a draw'}
          </h2>
        </span>
        <strong>{(result.timeMs / 1000).toFixed(1)}s</strong>
      </header>
      <div className="pvp-battle-result-sides">
        {candidates.map((candidate, index) => {
          const combatant = result.fighters[index];
          const hpPercent = combatant.maxHp > 0
            ? Math.max(0, (combatant.hp / combatant.maxHp) * 100)
            : 0;
          return (
            <article key={candidate.key}>
              <img src={resolveAssetUrl(candidate.entry.imageUrl)} alt="" draggable={false} />
              <span>
                <strong>{getPvPBattleCandidateLabel(candidate)}</strong>
                <i><b style={{ width: `${hpPercent}%` }} /></i>
                <small>{combatant.hp} / {combatant.maxHp} HP</small>
              </span>
              <div>
                <strong>{result.ratings[index]}</strong>
                <small>rating</small>
              </div>
              <div>
                <strong>{combatant.shields}</strong>
                <small>shields</small>
              </div>
              <div>
                <strong>{combatant.energy}</strong>
                <small>energy</small>
              </div>
            </article>
          );
        })}
      </div>
      <div className="pvp-battle-flow">
        <strong>Battle flow</strong>
        {keyEvents.length > 0 ? (
          <ol>
            {keyEvents.map((event, index) => (
              <li key={`${event.turn}-${event.actor}-${event.moveId}-${index}`}>
                <time>{(event.turn * 0.5).toFixed(1)}s</time>
                <span>
                  <strong>{getPvPBattleCandidateLabel(candidates[event.actor])}</strong>
                  {' used '}
                  {event.moveId.replaceAll('_', ' ')}
                </span>
                <small>
                  {event.shielded
                    ? 'Shielded'
                    : `${event.damage} damage`}
                  {event.buffed ? ' · stat change' : ''}
                </small>
              </li>
            ))}
          </ol>
        ) : (
          <p>No Charged Attacks were reached in this battle.</p>
        )}
      </div>
    </section>
  );
}

function TeamBattleResult({
  result,
  teams,
  sideLabels,
}: {
  result: PvPTeamBattleResponse;
  teams: [
    [PvPTeamCandidate, PvPTeamCandidate, PvPTeamCandidate],
    [PvPTeamCandidate, PvPTeamCandidate, PvPTeamCandidate],
  ];
  sideLabels: [string, string];
}) {
  const winnerLabel = result.winner < 0 ? null : sideLabels[result.winner];
  const firstMatchup = result.matchups[0];
  const surviving = result.teams.map(
    (team) => team.filter((member) => !member.fainted).length,
  );
  const candidateByFighterId = new Map(
    teams.flat().map((candidate) => [candidate.key, candidate]),
  );
  const switchCount = result.switches.filter(
    (event) => event.reason === 'adaptive',
  ).length;
  const summary = result.winner < 0
    ? 'Neither lineup finished the other.'
    : firstMatchup?.winner === result.winner
      ? `${winnerLabel} held its lead advantage through the lineup.`
      : firstMatchup?.winner >= 0
        ? `${winnerLabel} recovered after losing the opening matchup.`
        : `${winnerLabel} won through its back-line depth.`;

  return (
    <section className="pvp-team-battle-result" aria-live="polite">
      <header>
        <FaUsers aria-hidden="true" />
        <span>
          <small>
            {result.switchPolicy === 'adaptive'
              ? 'Switch-aware 3v3 result'
              : 'Fixed-order 3v3 result'}
          </small>
          <h2>{winnerLabel ? `${winnerLabel} wins` : 'Team battle ends in a draw'}</h2>
          <p>{summary}</p>
        </span>
        <strong>{(result.timeMs / 1000).toFixed(1)}s</strong>
      </header>

      <div className="pvp-team-battle-summary">
        {sideLabels.map((label, side) => (
          <span key={label}>
            <small>{label}</small>
            <strong>{surviving[side]} standing</strong>
            <b>{result.shields[side]} shields left</b>
          </span>
        ))}
        {result.switchPolicy === 'adaptive' && (
          <span>
            <small>Battle switching</small>
            <strong>{switchCount} adaptive</strong>
            <b>{result.switchClockMs / 1000}s clock</b>
          </span>
        )}
      </div>

      <div className="pvp-team-battle-sides">
        {teams.map((team, side) => (
          <section key={sideLabels[side]}>
            <header>{sideLabels[side]}</header>
            {team.map((candidate, index) => {
              const member = result.teams[side][index];
              const hpPercent = member.maxHp > 0
                ? Math.max(0, (member.hp / member.maxHp) * 100)
                : 0;
              return (
                <article
                  key={candidate.key}
                  className={member.fainted ? 'fainted' : ''}
                >
                  <span>{index + 1}</span>
                  <img
                    src={resolveAssetUrl(candidate.entry.imageUrl)}
                    alt=""
                    draggable={false}
                  />
                  <div>
                    <strong>{getPvPBattleCandidateLabel(candidate)}</strong>
                    <i><b style={{ width: `${hpPercent}%` }} /></i>
                    <small>
                      {member.hp} / {member.maxHp} HP · {member.energy} energy
                    </small>
                  </div>
                  <span>
                    <strong>{member.knockouts}</strong>
                    <small>
                      KOs{member.switches > 0 ? ` · ${member.switches} in` : ''}
                    </small>
                  </span>
                </article>
              );
            })}
          </section>
        ))}
      </div>

      <div className="pvp-team-battle-sequence">
        <strong>Battle sequence</strong>
        <ol>
          {[
            ...result.matchups.map((matchup) => ({
              kind: 'matchup' as const,
              atMs: matchup.endedAtMs,
              matchup,
            })),
            ...result.switches.map((event) => ({
              kind: 'switch' as const,
              atMs: event.atMs,
              event,
            })),
          ]
            .sort((left, right) =>
              left.atMs - right.atMs ||
              (left.kind === 'matchup' ? -1 : 1))
            .map((item) => {
              if (item.kind === 'switch') {
                const from = candidateByFighterId.get(item.event.fromFighterId);
                const to = candidateByFighterId.get(item.event.toFighterId);
                return (
                  <li
                    key={`switch-${item.event.index}-${item.event.side}`}
                    className="pvp-team-sequence-switch"
                  >
                    <span><FaExchangeAlt aria-hidden="true" /></span>
                    <div>
                      <strong>
                        {item.event.reason === 'adaptive'
                          ? `${sideLabels[item.event.side]} swaps ${from ? getPvPBattleCandidateLabel(from) : 'out'} for ${to ? getPvPBattleCandidateLabel(to) : 'its bench'}`
                          : `${sideLabels[item.event.side]} sends in ${to ? getPvPBattleCandidateLabel(to) : 'its next Pokémon'}`}
                      </strong>
                      <small>
                        {(item.event.atMs / 1000).toFixed(1)}s ·{' '}
                        {item.event.reason === 'adaptive'
                          ? `switch ready again at ${(item.event.switchReadyAtMs / 1000).toFixed(1)}s`
                          : 'forced replacement'}
                      </small>
                    </div>
                  </li>
                );
              }
              const { matchup } = item;
              const first = candidateByFighterId.get(matchup.fighterIds[0]);
              const second = candidateByFighterId.get(matchup.fighterIds[1]);
              const matchupWinner = matchup.winner < 0
                ? null
                : matchup.winner === 0 ? first : second;
              const matchupLoser = matchup.winner < 0
                ? null
                : matchup.winner === 0 ? second : first;
              return (
                <li key={`${matchup.index}-${matchup.fighterIds.join('-')}`}>
                  <span>{matchup.index + 1}</span>
                  <div>
                    <strong>
                      {matchupWinner && matchupLoser
                        ? `${getPvPBattleCandidateLabel(matchupWinner)} defeats ${getPvPBattleCandidateLabel(matchupLoser)}`
                        : matchup.endedBy === 'switch'
                          ? `${first ? getPvPBattleCandidateLabel(first) : 'Side A'} pressures ${second ? getPvPBattleCandidateLabel(second) : 'Side B'} into a decision`
                          : `${first ? getPvPBattleCandidateLabel(first) : 'Side A'} and ${second ? getPvPBattleCandidateLabel(second) : 'Side B'} draw`}
                    </strong>
                    <small>
                      {(matchup.startedAtMs / 1000).toFixed(1)}-
                      {(matchup.endedAtMs / 1000).toFixed(1)}s ·{' '}
                      {matchup.shieldsAfter[0]}-{matchup.shieldsAfter[1]} shields
                    </small>
                  </div>
                </li>
              );
            })}
        </ol>
      </div>
    </section>
  );
}

function SwitchPolicyControl({
  value,
  onChange,
}: {
  value: PvPTeamSwitchPolicy;
  onChange: (value: PvPTeamSwitchPolicy) => void;
}) {
  return (
    <section className="pvp-team-switch-policy" aria-label="Team switching model">
      <header>
        <FaClock aria-hidden="true" />
        <span>
          <strong>Switching</strong>
          <small>Current 45-second battle clock</small>
        </span>
      </header>
      <div role="group" aria-label="Switching strategy">
        <button
          type="button"
          className={value === 'adaptive' ? 'active' : ''}
          aria-pressed={value === 'adaptive'}
          onClick={() => onChange('adaptive')}
        >
          <FaExchangeAlt aria-hidden="true" />
          <span>
            <strong>Adaptive</strong>
            <small>Escape clear losses and counter-switch</small>
          </span>
        </button>
        <button
          type="button"
          className={value === 'fixed' ? 'active' : ''}
          aria-pressed={value === 'fixed'}
          onClick={() => onChange('fixed')}
        >
          <FaUsers aria-hidden="true" />
          <span>
            <strong>Fixed order</strong>
            <small>Lead, Safe Swap, then Closer</small>
          </span>
        </button>
      </div>
    </section>
  );
}

function MetaGauntletResult({
  result,
  teams,
}: {
  result: PvPTeamGauntletResponse;
  teams: PvPRepresentativeMetaTeam[];
}) {
  const teamById = new Map(teams.map((team) => [team.id, team]));
  return (
    <section className="pvp-meta-gauntlet-result" aria-live="polite">
      <header>
        <FaTrophy aria-hidden="true" />
        <span>
          <small>Role-balanced meta field</small>
          <h2>{result.wins}-{result.losses}-{result.draws}</h2>
          <p>Wins, losses, and draws against current top role combinations.</p>
        </span>
      </header>
      <div>
        {result.results.map((fieldResult) => {
          const team = teamById.get(fieldResult.opponentId);
          const won = fieldResult.result.winner === 0;
          const draw = fieldResult.result.winner < 0;
          const lead = fieldResult.result.matchups[0];
          const Icon = draw ? FaMinusCircle : won ? FaCheckCircle : FaTimesCircle;
          const standing = fieldResult.result.teams[
            won ? 0 : 1
          ].filter((member) => !member.fainted).length;
          return (
            <article
              key={fieldResult.opponentId}
              className={draw ? 'draw' : won ? 'win' : 'loss'}
            >
              <Icon aria-hidden="true" />
              <div className="pvp-meta-gauntlet-team">
                {team?.members.map((candidate) => (
                  <img
                    key={candidate.key}
                    src={resolveAssetUrl(candidate.entry.imageUrl)}
                    alt=""
                    title={getPvPBattleCandidateLabel(candidate)}
                    draggable={false}
                  />
                ))}
              </div>
              <span>
                <strong>{fieldResult.opponentLabel}</strong>
                <small>
                  {draw
                    ? 'Even result'
                    : `${won ? 'Clear' : 'Loss'} · ${standing} standing`}
                  {lead?.winner === 1 ? ' · lost lead' : ''}
                  {' · '}
                  {fieldResult.result.switches.filter(
                    (event) => event.reason === 'adaptive',
                  ).length} swaps
                </small>
              </span>
            </article>
          );
        })}
      </div>
      <footer>
        These are deterministic Lead, Switch, and Closer combinations generated
        from the current ranking snapshot, not claimed historical player teams.
      </footer>
    </section>
  );
}

const PvpBattleLab = ({
  candidates,
  opponentCandidates = candidates,
  formatLabel,
  mechanics,
  initialSelection = null,
  playerSideLabel = 'Side A',
}: {
  candidates: PvPTeamCandidate[];
  opponentCandidates?: PvPTeamCandidate[];
  formatLabel: string;
  mechanics: PokemonPvPBattleMechanics;
  initialSelection?: {
    mode?: BattleMode;
    leftKey: string;
    rightKey: string;
    leftTeamKeys?: string[];
    rightTeamKeys?: string[];
  } | null;
  playerSideLabel?: string;
}) => {
  const readyCandidates = useMemo(
    () => candidates.filter(isPvPBattleCandidateReady),
    [candidates],
  );
  const readyOpponents = useMemo(
    () => opponentCandidates.filter(isPvPBattleCandidateReady),
    [opponentCandidates],
  );
  const [mode, setMode] = useState<BattleMode>(
    initialSelection?.mode ?? 'single',
  );
  const [selectedKeys, setSelectedKeys] = useState<[string, string]>(() => {
    const left =
      readyCandidates.find((candidate) => candidate.key === initialSelection?.leftKey) ??
      readyCandidates[0];
    const right =
      readyOpponents.find((candidate) => candidate.key === initialSelection?.rightKey) ??
      readyOpponents.find((candidate) => candidate.key !== left?.key) ??
      readyOpponents[0];
    return [left?.key ?? '', right?.key ?? ''];
  });
  const [teamKeys, setTeamKeys] = useState<[TeamKeys, TeamKeys]>(() => [
    buildInitialTeamKeys(
      readyCandidates,
      initialSelection?.leftTeamKeys ?? [initialSelection?.leftKey ?? ''],
    ),
    buildInitialTeamKeys(
      readyOpponents,
      initialSelection?.rightTeamKeys ?? [initialSelection?.rightKey ?? ''],
    ),
  ]);
  const [shields, setShields] = useState<[number, number]>([1, 1]);
  const [energy, setEnergy] = useState<[number, number]>([0, 0]);
  const [teamShields, setTeamShields] = useState<[number, number]>([2, 2]);
  const [teamEnergy, setTeamEnergy] = useState<[number, number]>([0, 0]);
  const [switchPolicy, setSwitchPolicy] =
    useState<PvPTeamSwitchPolicy>('adaptive');
  const [result, setResult] = useState<PokemonPvPBattleResponse | null>(null);
  const [teamResult, setTeamResult] =
    useState<PvPTeamBattleResponse | null>(null);
  const [gauntletResult, setGauntletResult] =
    useState<PvPTeamGauntletResponse | null>(null);
  const [error, setError] = useState('');
  const [simulating, setSimulating] = useState(false);
  const [testingField, setTestingField] = useState(false);
  const leftCandidateByKey = useMemo(
    () => new Map(candidates.map((candidate) => [candidate.key, candidate])),
    [candidates],
  );
  const rightCandidateByKey = useMemo(
    () => new Map(
      opponentCandidates.map((candidate) => [candidate.key, candidate]),
    ),
    [opponentCandidates],
  );
  const selected: [
    PvPTeamCandidate | undefined,
    PvPTeamCandidate | undefined,
  ] = [
    leftCandidateByKey.get(selectedKeys[0]),
    rightCandidateByKey.get(selectedKeys[1]),
  ];
  const selectedTeams: [
    Array<PvPTeamCandidate | undefined>,
    Array<PvPTeamCandidate | undefined>,
  ] = [
    teamKeys[0].map((key) => leftCandidateByKey.get(key)),
    teamKeys[1].map((key) => rightCandidateByKey.get(key)),
  ];
  const completeTeams = selectedTeams.every(
    (team) => team.length === 3 && team.every(Boolean),
  );
  const representativeTeams = useMemo(
    () => buildRepresentativePvPMetaTeams(readyOpponents),
    [readyOpponents],
  );
  const sideLabels: [string, string] = [playerSideLabel, 'Opponent'];
  const canSwap =
    selected[0] != null &&
    selected[1] != null &&
    leftCandidateByKey.has(selected[1].key) &&
    rightCandidateByKey.has(selected[0].key);

  const changeSelection = (index: number, candidate: PvPTeamCandidate) => {
    setSelectedKeys((current) => {
      const next: [string, string] = [...current];
      next[index] = candidate.key;
      return next;
    });
    setResult(null);
    setTeamResult(null);
    setError('');
  };
  const changeTeamSelection = (
    side: number,
    index: number,
    candidate: PvPTeamCandidate,
  ) => {
    setTeamKeys((current) => {
      const next: [TeamKeys, TeamKeys] = [
        [...current[0]] as TeamKeys,
        [...current[1]] as TeamKeys,
      ];
      next[side][index] = candidate.key;
      return next;
    });
    setTeamResult(null);
    setGauntletResult(null);
    setError('');
  };
  const changePair = (
    setter: Dispatch<SetStateAction<[number, number]>>,
    index: number,
    value: number,
  ) => {
    setter((current) => {
      const next: [number, number] = [...current];
      next[index] = value;
      return next;
    });
    setResult(null);
    setTeamResult(null);
    setGauntletResult(null);
    setError('');
  };

  const changeSwitchPolicy = (value: PvPTeamSwitchPolicy) => {
    setSwitchPolicy(value);
    setTeamResult(null);
    setGauntletResult(null);
    setError('');
  };

  const simulate = async () => {
    if (!selected[0] || !selected[1]) return;
    const fighters = [
      buildPvPBattleFighter(selected[0]),
      buildPvPBattleFighter(selected[1]),
    ];
    if (!fighters[0] || !fighters[1]) {
      setError('This ranking snapshot does not include complete battle move data for both builds.');
      return;
    }

    setSimulating(true);
    setResult(null);
    setError('');
    try {
      const next = await simulatePvPBattleAsync({
        mechanics,
        fighters: [fighters[0], fighters[1]],
        shields,
        startingEnergy: energy,
        recordTimeline: true,
      });
      setResult(next);
    } catch (simulationError) {
      setError(
        simulationError instanceof Error
          ? simulationError.message
          : 'The battle could not be simulated.',
      );
    } finally {
      setSimulating(false);
    }
  };

  const simulateTeam = async () => {
    if (!completeTeams) return;
    const leftTeam = selectedTeams[0] as [
      PvPTeamCandidate,
      PvPTeamCandidate,
      PvPTeamCandidate,
    ];
    const rightTeam = selectedTeams[1] as [
      PvPTeamCandidate,
      PvPTeamCandidate,
      PvPTeamCandidate,
    ];
    const leftFighters = leftTeam.map(buildPvPBattleFighter);
    const rightFighters = rightTeam.map(buildPvPBattleFighter);
    if (leftFighters.some((fighter) => !fighter) ||
      rightFighters.some((fighter) => !fighter)) {
      setError('Every team member needs complete stats and PvP move data.');
      return;
    }

    setSimulating(true);
    setTeamResult(null);
    setGauntletResult(null);
    setError('');
    try {
      const next = await simulatePvPTeamBattleAsync({
        kind: 'team-battle',
        mechanics,
        teams: [
          [
            leftFighters[0]!,
            leftFighters[1]!,
            leftFighters[2]!,
          ],
          [
            rightFighters[0]!,
            rightFighters[1]!,
            rightFighters[2]!,
          ],
        ],
        shields: teamShields,
        startingEnergy: teamEnergy,
        switchPolicy,
      });
      setTeamResult(next);
    } catch (simulationError) {
      setError(
        simulationError instanceof Error
          ? simulationError.message
          : 'The team battle could not be simulated.',
      );
    } finally {
      setSimulating(false);
    }
  };

  const runMetaGauntlet = async () => {
    if (!completeTeams || representativeTeams.length === 0) return;
    const leftTeam = selectedTeams[0] as [
      PvPTeamCandidate,
      PvPTeamCandidate,
      PvPTeamCandidate,
    ];
    const leftFighters = leftTeam.map(buildPvPBattleFighter);
    const field = representativeTeams.map((team) => ({
      ...team,
      fighters: team.members.map(buildPvPBattleFighter),
    }));
    if (
      leftFighters.some((fighter) => !fighter) ||
      field.some((team) => team.fighters.some((fighter) => !fighter))
    ) {
      setError('The meta field needs complete stats and PvP move data.');
      return;
    }

    setTestingField(true);
    setGauntletResult(null);
    setError('');
    try {
      const next = await simulatePvPTeamGauntletAsync({
        kind: 'team-gauntlet',
        mechanics,
        team: [
          leftFighters[0]!,
          leftFighters[1]!,
          leftFighters[2]!,
        ],
        opponents: field.map((team) => ({
          id: team.id,
          label: team.label,
          team: [
            team.fighters[0]!,
            team.fighters[1]!,
            team.fighters[2]!,
          ],
        })),
        shields: teamShields[0],
        switchPolicy,
      });
      setGauntletResult(next);
    } catch (simulationError) {
      setError(
        simulationError instanceof Error
          ? simulationError.message
          : 'The meta team check could not be completed.',
      );
    } finally {
      setTestingField(false);
    }
  };

  return (
    <section className="pvp-battle-lab">
      <header>
        <span>
          <FaFlask aria-hidden="true" />
          <strong>Battle Lab</strong>
        </span>
        <small>
          {formatLabel} · {mode === 'team'
            ? switchPolicy === 'adaptive' ? 'switch-aware 3v3' : 'fixed-order 3v3'
            : 'focused 1v1'} ·
          {' '}{pvpBattleMechanicsLabel(mechanics)}
        </small>
      </header>

      {(readyCandidates.length < candidates.length ||
        readyOpponents.length < opponentCandidates.length) && (
        <p className="pvp-battle-notice">
          {readyCandidates.length} player builds and {readyOpponents.length}{' '}
          opponents have complete simulation data.
        </p>
      )}

      <div className="pvp-battle-mode" role="group" aria-label="Battle Lab mode">
        <button
          type="button"
          className={mode === 'single' ? 'active' : ''}
          aria-pressed={mode === 'single'}
          onClick={() => {
            setMode('single');
            setTeamResult(null);
            setGauntletResult(null);
            setError('');
          }}
        >
          <FaFlask aria-hidden="true" />
          Focused 1v1
        </button>
        <button
          type="button"
          className={mode === 'team' ? 'active' : ''}
          aria-pressed={mode === 'team'}
          onClick={() => {
            setMode('team');
            setResult(null);
            setError('');
          }}
        >
          <FaUsers aria-hidden="true" />
          Team battle
        </button>
      </div>

      {mode === 'single' ? (
        <>
          <div className="pvp-battle-pickers">
            <CandidatePicker
              side={sideLabels[0]}
              candidates={readyCandidates}
              selected={selected[0]}
              onSelect={(candidate) => changeSelection(0, candidate)}
            />
            <button
              type="button"
              className="pvp-battle-swap"
              aria-label="Swap battle sides"
              disabled={!canSwap}
              onClick={() => {
                if (!canSwap) return;
                setSelectedKeys(([left, right]) => [right, left]);
                setResult(null);
              }}
            >
              <FaExchangeAlt aria-hidden="true" />
            </button>
            <CandidatePicker
              side={sideLabels[1]}
              candidates={readyOpponents}
              selected={selected[1]}
              onSelect={(candidate) => changeSelection(1, candidate)}
            />
          </div>

          <div className="pvp-battle-builds">
            <BattleBuild candidate={selected[0]} />
            <BattleBuild candidate={selected[1]} />
          </div>

          <section className="pvp-battle-controls" aria-label="Battle conditions">
            <div>
              <ShieldControl
                label={sideLabels[0]}
                value={shields[0]}
                onChange={(value) => changePair(setShields, 0, value)}
              />
              <EnergyControl
                label={sideLabels[0]}
                value={energy[0]}
                onChange={(value) => changePair(setEnergy, 0, value)}
              />
            </div>
            <div>
              <ShieldControl
                label={sideLabels[1]}
                value={shields[1]}
                onChange={(value) => changePair(setShields, 1, value)}
              />
              <EnergyControl
                label={sideLabels[1]}
                value={energy[1]}
                onChange={(value) => changePair(setEnergy, 1, value)}
              />
            </div>
          </section>

          <button
            type="button"
            className="pvp-battle-run"
            disabled={simulating || !selected[0] || !selected[1]}
            onClick={() => void simulate()}
          >
            <FaPlay aria-hidden="true" />
            {simulating ? 'Simulating...' : 'Run battle'}
          </button>
          {result && selected[0] && selected[1] && (
            <BattleResult result={result} candidates={[selected[0], selected[1]]} />
          )}
        </>
      ) : (
        <>
          <div className="pvp-team-battle-lineups">
            <TeamLineupEditor
              side={sideLabels[0]}
              candidates={readyCandidates}
              selectedKeys={teamKeys[0]}
              candidateByKey={leftCandidateByKey}
              onChange={(index, candidate) =>
                changeTeamSelection(0, index, candidate)}
            />
            <TeamLineupEditor
              side={sideLabels[1]}
              candidates={readyOpponents}
              selectedKeys={teamKeys[1]}
              candidateByKey={rightCandidateByKey}
              onChange={(index, candidate) =>
                changeTeamSelection(1, index, candidate)}
            />
          </div>

          <SwitchPolicyControl
            value={switchPolicy}
            onChange={changeSwitchPolicy}
          />

          <section
            className="pvp-battle-controls pvp-team-battle-controls"
            aria-label="Team battle conditions"
          >
            <div>
              <ShieldControl
                label={sideLabels[0]}
                value={teamShields[0]}
                onChange={(value) => changePair(setTeamShields, 0, value)}
              />
              <EnergyControl
                label={`${sideLabels[0]} lead`}
                value={teamEnergy[0]}
                onChange={(value) => changePair(setTeamEnergy, 0, value)}
              />
            </div>
            <div>
              <ShieldControl
                label={sideLabels[1]}
                value={teamShields[1]}
                onChange={(value) => changePair(setTeamShields, 1, value)}
              />
              <EnergyControl
                label={`${sideLabels[1]} lead`}
                value={teamEnergy[1]}
                onChange={(value) => changePair(setTeamEnergy, 1, value)}
              />
            </div>
          </section>

          <div className="pvp-team-battle-actions">
            <button
              type="button"
              className="pvp-battle-run"
              disabled={simulating || testingField || !completeTeams}
              onClick={() => void simulateTeam()}
            >
              <FaPlay aria-hidden="true" />
              {simulating ? 'Simulating team...' : 'Run team battle'}
            </button>
            <button
              type="button"
              className="pvp-meta-gauntlet-run"
              disabled={
                simulating ||
                testingField ||
                !completeTeams ||
                representativeTeams.length === 0
              }
              onClick={() => void runMetaGauntlet()}
            >
              <FaTrophy aria-hidden="true" />
              {testingField
                ? 'Testing field...'
                : `Test ${representativeTeams.length} meta teams`}
            </button>
          </div>
          {teamResult && completeTeams && (
            <TeamBattleResult
              result={teamResult}
              teams={selectedTeams as [
                [PvPTeamCandidate, PvPTeamCandidate, PvPTeamCandidate],
                [PvPTeamCandidate, PvPTeamCandidate, PvPTeamCandidate],
              ]}
              sideLabels={sideLabels}
            />
          )}
          {gauntletResult && (
            <MetaGauntletResult
              result={gauntletResult}
              teams={representativeTeams}
            />
          )}
        </>
      )}

      {error && <div className="pvp-status pvp-status--error" role="alert">{error}</div>}
      {mode === 'single' &&
        !result &&
        !error &&
        (readyCandidates.length < 1 || readyOpponents.length < 1) && (
        <div className="pvp-status">
          Battle Lab needs a player build and opponent with complete stats and
          PvP move data.
        </div>
      )}
      {mode === 'team' && !teamResult && !error && !completeTeams && (
        <div className="pvp-status">
          Team Battle needs three unique, battle-ready Pokémon on each side.
        </div>
      )}
      <footer>
        <FaHeartbeat aria-hidden="true" />
        {mode === 'team'
          ? switchPolicy === 'adaptive'
            ? 'The local model can escape clear losing matchups, counter-switch on a 45-second clock, and preserve every benched Pokémon’s HP and energy.'
            : 'Fixed order keeps the selected Lead, Safe Swap, and Closer sequence while preserving shared shields, HP, and energy.'
          : 'Results are calculated on this device from the selected builds, shield counts, starting energy, and deterministic pinned mechanics.'}
      </footer>
    </section>
  );
};

export default PvpBattleLab;
