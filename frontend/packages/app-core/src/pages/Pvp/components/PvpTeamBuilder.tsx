import { useEffect, useMemo, useState } from 'react';
import {
  FaCheck,
  FaPlus,
  FaSearch,
  FaShieldAlt,
  FaTimes,
  FaUsers,
} from 'react-icons/fa';

import { getTypeIconPath } from '@/utils/imageHelpers';
import { resolveAssetUrl } from '@/utils/assetUrl';
import {
  getStorageJson,
  setStorageJson,
  STORAGE_KEYS,
} from '@/utils/storage';
import type { PokemonPvPRankingEntry } from '@shared-contracts/pokemon';

import {
  analyzePvPTeam,
  formatPvPSpeciesName,
  type PvPTeamCandidate,
} from '../utils/pvpTeamBuilder';

const TEAM_SIZE = 3;
const CANDIDATE_LIMIT = 40;

type SavedPvPTeams = Record<string, string[]>;

const loadSavedTeam = (storageKey: string): string[] => {
  const saved = getStorageJson<SavedPvPTeams>(STORAGE_KEYS.pvpTeams);
  const keys = saved?.[storageKey];
  return Array.isArray(keys)
    ? keys.filter((key): key is string => typeof key === 'string').slice(0, TEAM_SIZE)
    : [];
};

const saveTeam = (storageKey: string, keys: string[]): void => {
  const saved = getStorageJson<SavedPvPTeams>(STORAGE_KEYS.pvpTeams) ?? {};
  setStorageJson(STORAGE_KEYS.pvpTeams, {
    ...saved,
    [storageKey]: keys.slice(0, TEAM_SIZE),
  });
};

const normalizedSearch = (candidate: PvPTeamCandidate): string =>
  [
    candidate.entry.name,
    candidate.entry.speciesId,
    candidate.nickname ?? '',
    ...candidate.entry.types,
    ...candidate.entry.moveset.flatMap((move) => [move.name, move.type]),
  ].join(' ').toLowerCase();

const strongestRole = (entry: PokemonPvPRankingEntry): string => {
  const labels = ['Lead', 'Closer', 'Switch', 'Charger', 'Attacker', 'Consistency'];
  const scores = entry.categoryScores ?? [];
  let bestIndex = 0;
  for (let index = 1; index < scores.length; index += 1) {
    if ((scores[index] ?? 0) > (scores[bestIndex] ?? 0)) bestIndex = index;
  }
  return labels[bestIndex] ?? 'Overall';
};

function TeamMember({
  member,
  slot,
  onRemove,
}: {
  member: PvPTeamCandidate | undefined;
  slot: number;
  onRemove: () => void;
}) {
  if (!member) {
    return (
      <div className="pvp-team-slot pvp-team-slot--empty">
        <span>{slot}</span>
        <FaPlus aria-hidden="true" />
        <strong>Choose Pokémon</strong>
      </div>
    );
  }

  return (
    <div className="pvp-team-slot">
      <span>{slot}</span>
      <img
        src={resolveAssetUrl(member.entry.imageUrl)}
        alt=""
        draggable={false}
      />
      <div>
        <strong>{member.nickname || member.entry.name}</strong>
        {member.nickname && <small>{member.entry.name}</small>}
        <small>{strongestRole(member.entry)} profile</small>
      </div>
      <button
        type="button"
        aria-label={`Remove ${member.nickname || member.entry.name} from team`}
        onClick={onRemove}
      >
        <FaTimes aria-hidden="true" />
      </button>
    </div>
  );
}

const PvpTeamBuilder = ({
  candidates,
  entriesBySpeciesId,
  storageKey,
}: {
  candidates: PvPTeamCandidate[];
  entriesBySpeciesId: Map<string, PokemonPvPRankingEntry>;
  storageKey: string;
}) => {
  const [selectedKeys, setSelectedKeys] = useState<string[]>(
    () => loadSavedTeam(storageKey),
  );
  const [search, setSearch] = useState('');
  const candidatesByKey = useMemo(
    () => new Map(candidates.map((candidate) => [candidate.key, candidate])),
    [candidates],
  );
  const team = useMemo(
    () =>
      selectedKeys
        .map((key) => candidatesByKey.get(key))
        .filter((candidate): candidate is PvPTeamCandidate => candidate != null),
    [candidatesByKey, selectedKeys],
  );
  const selected = useMemo(
    () => new Set(team.map((member) => member.key)),
    [team],
  );
  const analysis = useMemo(
    () => analyzePvPTeam(team, candidates),
    [candidates, team],
  );
  const query = search.trim().toLowerCase();
  const visibleCandidates = candidates
    .filter((candidate) => !query || normalizedSearch(candidate).includes(query))
    .slice(0, CANDIDATE_LIMIT);
  const hasMatchupEvidence = candidates.some(
    (candidate) =>
      (candidate.entry.matchups?.length ?? 0) > 0 ||
      (candidate.entry.counters?.length ?? 0) > 0,
  );

  useEffect(() => {
    saveTeam(storageKey, selectedKeys);
  }, [selectedKeys, storageKey]);

  const toggleMember = (key: string) => {
    setSelectedKeys((current) => {
      if (current.includes(key)) return current.filter((item) => item !== key);
      if (current.length >= TEAM_SIZE) return current;
      return [...current, key];
    });
  };

  const threatName = (speciesId: string) =>
    entriesBySpeciesId.get(speciesId)?.name ?? formatPvPSpeciesName(speciesId);

  return (
    <section className="pvp-team-builder" aria-label="PvP Team Builder">
      <header>
        <div>
          <FaUsers aria-hidden="true" />
          <span>
            <small>Three-Pokémon team</small>
            <h2>Team Builder</h2>
          </span>
        </div>
        <strong>{team.length} / {TEAM_SIZE}</strong>
      </header>

      <div className="pvp-team-slots">
        {Array.from({ length: TEAM_SIZE }, (_, index) => (
          <TeamMember
            key={index}
            member={team[index]}
            slot={index + 1}
            onRemove={() => {
              const member = team[index];
              if (member) toggleMember(member.key);
            }}
          />
        ))}
      </div>

      {team.length > 0 && (
        <section className="pvp-team-analysis" aria-label="Team threat analysis">
          <header>
            <div>
              <FaShieldAlt aria-hidden="true" />
              <span>
                <small>Published matchup evidence</small>
                <h3>Coverage check</h3>
              </span>
            </div>
            {hasMatchupEvidence && (
              <strong>
                {analysis.exposedThreats.length === 0
                  ? 'No open listed threats'
                  : `${analysis.exposedThreats.length} open`}
              </strong>
            )}
          </header>

          {!hasMatchupEvidence ? (
            <p>
              Matchup evidence will appear after the detailed ranking snapshot
              is loaded.
            </p>
          ) : (
            <>
              <div className="pvp-threat-list">
                {analysis.threats.slice(0, 10).map((threat) => (
                  <span
                    key={threat.speciesId}
                    className={threat.coveredByKeys.length > 0 ? 'covered' : 'open'}
                  >
                    {entriesBySpeciesId.get(threat.speciesId)?.imageUrl && (
                      <img
                        src={resolveAssetUrl(
                          entriesBySpeciesId.get(threat.speciesId)?.imageUrl ?? '',
                        )}
                        alt=""
                        draggable={false}
                      />
                    )}
                    <strong>{threatName(threat.speciesId)}</strong>
                    <small>
                      Threatens {threat.affectedKeys.length}
                      {' · '}
                      {threat.coveredByKeys.length > 0 ? 'Covered' : 'Open'}
                    </small>
                  </span>
                ))}
              </div>

              {analysis.recommendations.length > 0 && team.length < TEAM_SIZE && (
                <div className="pvp-team-suggestions">
                  <strong>Best coverage additions</strong>
                  <div>
                    {analysis.recommendations.map(({ candidate, covers }) => (
                      <button
                        type="button"
                        key={candidate.key}
                        onClick={() => toggleMember(candidate.key)}
                      >
                        <img
                          src={resolveAssetUrl(candidate.entry.imageUrl)}
                          alt=""
                          draggable={false}
                        />
                        <span>
                          <strong>{candidate.entry.name}</strong>
                          <small>Covers {covers.length} open threat{covers.length === 1 ? '' : 's'}</small>
                        </span>
                        <FaPlus aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      )}

      <section className="pvp-team-picks">
        <label>
          <FaSearch aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Find Pokémon, type, or move"
            aria-label="Search Team Builder Pokémon"
          />
        </label>

        <div>
          {visibleCandidates.map((candidate) => {
            const isSelected = selected.has(candidate.key);
            const disabled = !isSelected && team.length >= TEAM_SIZE;
            return (
              <article key={candidate.key} className={isSelected ? 'selected' : ''}>
                <img
                  src={resolveAssetUrl(candidate.entry.imageUrl)}
                  alt=""
                  loading="lazy"
                  draggable={false}
                />
                <span>
                  <strong>{candidate.nickname || candidate.entry.name}</strong>
                  {candidate.nickname && <small>{candidate.entry.name}</small>}
                  <small>{candidate.entry.score.toFixed(1)} overall</small>
                </span>
                <span className="pvp-team-pick-types">
                  {candidate.entry.types.map((type) => (
                    <img
                      key={type}
                      src={getTypeIconPath(type)}
                      alt=""
                      title={type}
                      draggable={false}
                    />
                  ))}
                </span>
                <button
                  type="button"
                  disabled={disabled}
                  aria-label={`${isSelected ? 'Unselect' : 'Select'} ${candidate.nickname || candidate.entry.name}`}
                  onClick={() => toggleMember(candidate.key)}
                >
                  {isSelected ? <FaCheck aria-hidden="true" /> : <FaPlus aria-hidden="true" />}
                </button>
              </article>
            );
          })}
        </div>

        {candidates.length > CANDIDATE_LIMIT && !query && (
          <small>Showing the top {CANDIDATE_LIMIT}. Search to reach the full ranking.</small>
        )}
      </section>
    </section>
  );
};

export default PvpTeamBuilder;
