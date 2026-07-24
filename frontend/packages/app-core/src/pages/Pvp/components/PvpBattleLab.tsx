import {
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import {
  FaBolt,
  FaExchangeAlt,
  FaFlask,
  FaHeartbeat,
  FaPlay,
  FaSearch,
  FaShieldAlt,
} from 'react-icons/fa';

import { simulatePokemonPvPBattle } from '@/services/pokemonDataService';
import { resolveAssetUrl } from '@/utils/assetUrl';
import { getTypeIconPath } from '@/utils/imageHelpers';
import type {
  PokemonPvPBattleResponse,
} from '@shared-contracts/pokemon';

import {
  buildPvPBattleFighter,
  getPvPBattleCandidateLabel,
  isPvPBattleCandidateReady,
} from '../utils/pvpBattleLab';
import type { PvPTeamCandidate } from '../utils/pvpTeamBuilder';

const PICK_LIMIT = 12;

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

const PvpBattleLab = ({
  candidates,
  formatLabel,
}: {
  candidates: PvPTeamCandidate[];
  formatLabel: string;
}) => {
  const readyCandidates = useMemo(
    () => candidates.filter(isPvPBattleCandidateReady),
    [candidates],
  );
  const [selectedKeys, setSelectedKeys] = useState<[string, string]>([
    readyCandidates[0]?.key ?? '',
    readyCandidates[1]?.key ?? readyCandidates[0]?.key ?? '',
  ]);
  const [shields, setShields] = useState<[number, number]>([1, 1]);
  const [energy, setEnergy] = useState<[number, number]>([0, 0]);
  const [result, setResult] = useState<PokemonPvPBattleResponse | null>(null);
  const [error, setError] = useState('');
  const [simulating, setSimulating] = useState(false);
  const candidateByKey = useMemo(
    () => new Map(candidates.map((candidate) => [candidate.key, candidate])),
    [candidates],
  );
  const selected = selectedKeys.map((key) => candidateByKey.get(key)) as [
    PvPTeamCandidate | undefined,
    PvPTeamCandidate | undefined,
  ];

  const changeSelection = (index: number, candidate: PvPTeamCandidate) => {
    setSelectedKeys((current) => {
      const next: [string, string] = [...current];
      next[index] = candidate.key;
      return next;
    });
    setResult(null);
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
      const next = await simulatePokemonPvPBattle({
        mechanics: 'pvpoke-legacy',
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

  return (
    <section className="pvp-battle-lab">
      <header>
        <span>
          <FaFlask aria-hidden="true" />
          <strong>Battle Lab</strong>
        </span>
        <small>{formatLabel} · pinned PvPoke mechanics</small>
      </header>

      {readyCandidates.length < candidates.length && (
        <p className="pvp-battle-notice">
          {readyCandidates.length} of {candidates.length} builds have complete simulation data.
        </p>
      )}

      <div className="pvp-battle-pickers">
        <CandidatePicker
          side="Side A"
          candidates={readyCandidates}
          selected={selected[0]}
          onSelect={(candidate) => changeSelection(0, candidate)}
        />
        <button
          type="button"
          className="pvp-battle-swap"
          aria-label="Swap battle sides"
          onClick={() => {
            setSelectedKeys(([left, right]) => [right, left]);
            setResult(null);
          }}
        >
          <FaExchangeAlt aria-hidden="true" />
        </button>
        <CandidatePicker
          side="Side B"
          candidates={readyCandidates}
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
            label="Side A"
            value={shields[0]}
            onChange={(value) => changePair(setShields, 0, value)}
          />
          <EnergyControl
            label="Side A"
            value={energy[0]}
            onChange={(value) => changePair(setEnergy, 0, value)}
          />
        </div>
        <div>
          <ShieldControl
            label="Side B"
            value={shields[1]}
            onChange={(value) => changePair(setShields, 1, value)}
          />
          <EnergyControl
            label="Side B"
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
      {error && <div className="pvp-status pvp-status--error" role="alert">{error}</div>}
      {result && selected[0] && selected[1] && (
        <BattleResult result={result} candidates={[selected[0], selected[1]]} />
      )}
      {!result && !error && readyCandidates.length < 2 && (
        <div className="pvp-status">
          Battle Lab needs two builds with complete stats and PvP move data.
        </div>
      )}
      <footer>
        <FaHeartbeat aria-hidden="true" />
        Results use the selected builds, shield counts, starting energy, and deterministic pinned mechanics.
      </footer>
    </section>
  );
};

export default PvpBattleLab;
