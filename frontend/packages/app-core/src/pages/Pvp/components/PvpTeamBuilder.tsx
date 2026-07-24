import { useEffect, useMemo, useState } from 'react';
import {
  FaCheck,
  FaExchangeAlt,
  FaFistRaised,
  FaFlag,
  FaFlask,
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
  rankPvPTeamCandidates,
  type PvPTeamCandidate,
} from '../utils/pvpTeamBuilder';
import {
  buildPvPBattleFighter,
  isPvPBattleCandidateReady,
} from '../utils/pvpBattleLab';
import { evaluatePvPTeamAsync } from '../utils/pvpWorkers';
import type {
  PvPTeamEvaluationResponse,
  PvPTeamRole,
  PvPTeamWorkerRequest,
} from '../utils/pvpWorkerProtocol';

const TEAM_SIZE = 3;
const CANDIDATE_LIMIT = 40;
const FIELD_SIZE = 12;

type TeamSlots = [string | null, string | null, string | null];
type SavedPvPTeams = Record<string, Array<string | null>>;

const TEAM_ROLES: Array<{
  key: PvPTeamRole;
  label: string;
  detail: string;
  icon: typeof FaFlag;
}> = [
  { key: 'lead', label: 'Lead', detail: 'Even shields', icon: FaFlag },
  {
    key: 'switch',
    label: 'Safe Swap',
    detail: 'Energy advantage',
    icon: FaExchangeAlt,
  },
  { key: 'closer', label: 'Closer', detail: 'No shields', icon: FaFistRaised },
];

const EMPTY_TEAM: TeamSlots = [null, null, null];

const loadSavedTeam = (storageKey: string): TeamSlots => {
  const saved = getStorageJson<SavedPvPTeams>(STORAGE_KEYS.pvpTeams);
  const keys = saved?.[storageKey];
  if (!Array.isArray(keys)) return [...EMPTY_TEAM];
  const normalized = keys
    .slice(0, TEAM_SIZE)
    .map((key) => typeof key === 'string' ? key : null);
  while (normalized.length < TEAM_SIZE) normalized.push(null);
  return normalized as TeamSlots;
};

const saveTeam = (storageKey: string, keys: TeamSlots): void => {
  const saved = getStorageJson<SavedPvPTeams>(STORAGE_KEYS.pvpTeams) ?? {};
  setStorageJson(STORAGE_KEYS.pvpTeams, {
    ...saved,
    [storageKey]: [...keys],
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
  role,
  active,
  onActivate,
  onRemove,
}: {
  member: PvPTeamCandidate | undefined;
  role: (typeof TEAM_ROLES)[number];
  active: boolean;
  onActivate: () => void;
  onRemove: () => void;
}) {
  const Icon = role.icon;
  if (!member) {
    return (
      <button
        type="button"
        className={`pvp-team-slot pvp-team-slot--empty${active ? ' active' : ''}`}
        aria-pressed={active}
        aria-label={`Choose ${role.label}`}
        onClick={onActivate}
      >
        <span className="pvp-team-role">
          <Icon aria-hidden="true" />
          <span>
            <strong>{role.label}</strong>
            <small>{role.detail}</small>
          </span>
        </span>
        <FaPlus aria-hidden="true" />
        <strong>Choose Pokémon</strong>
      </button>
    );
  }

  return (
    <article className={`pvp-team-slot${active ? ' active' : ''}`}>
      <button
        type="button"
        className="pvp-team-slot-main"
        aria-pressed={active}
        aria-label={`Edit ${role.label}, ${member.nickname || member.entry.name}`}
        onClick={onActivate}
      >
        <span className="pvp-team-role">
          <Icon aria-hidden="true" />
          <span>
            <strong>{role.label}</strong>
            <small>{role.detail}</small>
          </span>
        </span>
        <img
          src={resolveAssetUrl(member.entry.imageUrl)}
          alt=""
          draggable={false}
        />
        <span className="pvp-team-slot-copy">
          <strong>{member.nickname || member.entry.name}</strong>
          {member.nickname && <small>{member.entry.name}</small>}
          <small>{strongestRole(member.entry)} profile</small>
        </span>
      </button>
      <button
        type="button"
        className="pvp-team-slot-remove"
        aria-label={`Remove ${member.nickname || member.entry.name} from team`}
        onClick={onRemove}
      >
        <FaTimes aria-hidden="true" />
      </button>
    </article>
  );
}

const PvpTeamBuilder = ({
  candidates,
  fieldCandidates,
  entriesBySpeciesId,
  storageKey,
  onTestMatchup,
}: {
  candidates: PvPTeamCandidate[];
  fieldCandidates: PvPTeamCandidate[];
  entriesBySpeciesId: Map<string, PokemonPvPRankingEntry>;
  storageKey: string;
  onTestMatchup: (memberKey: string, opponentKey: string) => void;
}) => {
  const [selectedKeys, setSelectedKeys] = useState<TeamSlots>(
    () => loadSavedTeam(storageKey),
  );
  const [activeSlot, setActiveSlot] = useState(0);
  const [search, setSearch] = useState('');
  const candidatesByKey = useMemo(
    () => new Map(candidates.map((candidate) => [candidate.key, candidate])),
    [candidates],
  );
  const teamMembers = useMemo(
    () => selectedKeys.map((key) => key ? candidatesByKey.get(key) : undefined),
    [candidatesByKey, selectedKeys],
  );
  const team = useMemo(
    () => teamMembers.filter(
      (candidate): candidate is PvPTeamCandidate => candidate != null,
    ),
    [teamMembers],
  );
  const selected = useMemo(
    () => new Set(team.map((member) => member.key)),
    [team],
  );
  const analysis = useMemo(
    () => analyzePvPTeam(team, candidates),
    [candidates, team],
  );
  const rankedCandidates = useMemo(
    () => rankPvPTeamCandidates(candidates),
    [candidates],
  );
  const query = search.trim().toLowerCase();
  const visibleCandidates = rankedCandidates
    .filter((candidate) => !query || normalizedSearch(candidate).includes(query))
    .slice(0, CANDIDATE_LIMIT);
  const hasMatchupEvidence = candidates.some(
    (candidate) =>
      (candidate.entry.matchups?.length ?? 0) > 0 ||
      (candidate.entry.counters?.length ?? 0) > 0,
  );
  const fieldCandidateByKey = useMemo(
    () => new Map(fieldCandidates.map((candidate) => [candidate.key, candidate])),
    [fieldCandidates],
  );
  const teamEvaluationRequest = useMemo<PvPTeamWorkerRequest | null>(() => {
    if (teamMembers.some((member) => member == null)) return null;
    const members = teamMembers.flatMap((member, index) => {
      if (!member) return [];
      const fighter = buildPvPBattleFighter(member);
      return fighter
        ? [{ fighter, role: TEAM_ROLES[index].key }]
        : [];
    });
    const opponents = fieldCandidates
      .filter(isPvPBattleCandidateReady)
      .slice(0, FIELD_SIZE)
      .flatMap((candidate) => {
        const fighter = buildPvPBattleFighter(candidate);
        return fighter
          ? [{
            fighter,
            weight: Math.max(0.25, Math.min(1, candidate.entry.score / 100)),
          }]
          : [];
      });
    if (members.length !== TEAM_SIZE || opponents.length === 0) return null;
    return { kind: 'team', members, opponents };
  }, [fieldCandidates, teamMembers]);
  const [teamEvaluation, setTeamEvaluation] =
    useState<PvPTeamEvaluationResponse | null>(null);
  const [teamEvaluationLoading, setTeamEvaluationLoading] = useState(false);
  const [teamEvaluationError, setTeamEvaluationError] = useState('');

  useEffect(() => {
    saveTeam(storageKey, selectedKeys);
  }, [selectedKeys, storageKey]);

  useEffect(() => {
    if (!teamEvaluationRequest) {
      setTeamEvaluation(null);
      setTeamEvaluationLoading(false);
      setTeamEvaluationError('');
      return;
    }

    const controller = new AbortController();
    setTeamEvaluation(null);
    setTeamEvaluationLoading(true);
    setTeamEvaluationError('');
    evaluatePvPTeamAsync(teamEvaluationRequest, controller.signal)
      .then((response) => {
        if (!controller.signal.aborted) setTeamEvaluation(response);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setTeamEvaluationError(
          error instanceof Error ? error.message : 'The team field test failed.',
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setTeamEvaluationLoading(false);
      });

    return () => controller.abort();
  }, [teamEvaluationRequest]);

  const chooseMember = (key: string, preferredSlot = activeSlot) => {
    const next = [...selectedKeys] as TeamSlots;
    const existingSlot = next.indexOf(key);
    if (existingSlot >= 0) {
      next[existingSlot] = null;
      setSelectedKeys(next);
      setActiveSlot(existingSlot);
      return;
    }

    const targetSlot =
      next[preferredSlot] == null
        ? preferredSlot
        : next.findIndex((item) => item == null);
    const resolvedSlot = targetSlot >= 0 ? targetSlot : preferredSlot;
    next[resolvedSlot] = key;
    const nextEmpty = next.findIndex((item) => item == null);
    setSelectedKeys(next);
    setActiveSlot(nextEmpty >= 0 ? nextEmpty : resolvedSlot);
  };

  const removeMember = (slot: number) => {
    setSelectedKeys((current) => {
      const next = [...current] as TeamSlots;
      next[slot] = null;
      return next;
    });
    setActiveSlot(slot);
  };

  const threatName = (speciesId: string) =>
    entriesBySpeciesId.get(speciesId)?.name ?? formatPvPSpeciesName(speciesId);
  const fieldLosses = teamEvaluation?.opponents.filter(
    (opponent) => !opponent.covered,
  ) ?? [];
  const activeRole = TEAM_ROLES[activeSlot];

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
            member={teamMembers[index]}
            role={TEAM_ROLES[index]}
            active={activeSlot === index}
            onActivate={() => setActiveSlot(index)}
            onRemove={() => removeMember(index)}
          />
        ))}
      </div>

      {team.length > 0 && (
        <section className="pvp-team-analysis" aria-label="Team threat analysis">
          <header>
            <div>
              <FaShieldAlt aria-hidden="true" />
              <span>
                <small>Local role field test</small>
                <h3>Team check</h3>
              </span>
            </div>
            {teamEvaluation && (
              <strong>
                {teamEvaluation.coverageCount} / {teamEvaluation.fieldSize} handled
              </strong>
            )}
          </header>

          {team.length < TEAM_SIZE && (
            <p>Fill all three roles to run the local meta field test.</p>
          )}
          {teamEvaluationLoading && (
            <p role="status">Testing this team against the current meta field...</p>
          )}
          {teamEvaluationError && (
            <p className="pvp-team-evaluation-error" role="alert">
              {teamEvaluationError}
            </p>
          )}
          {team.length === TEAM_SIZE &&
            !teamEvaluationRequest &&
            !teamEvaluationLoading && (
              <p>
                One or more selected builds lack complete local simulation data.
              </p>
            )}

          {teamEvaluation && (
            <>
              <div className="pvp-team-field-summary">
                <span>
                  <small>Field coverage</small>
                  <strong>
                    {teamEvaluation.coverageCount}/{teamEvaluation.fieldSize}
                  </strong>
                </span>
                <span>
                  <small>Shared losses</small>
                  <strong>{fieldLosses.length}</strong>
                </span>
                <span>
                  <small>Role tests</small>
                  <strong>{teamEvaluation.members.length}</strong>
                </span>
              </div>

              <div className="pvp-team-role-results">
                {teamEvaluation.members.map((result) => {
                  const member = candidatesByKey.get(result.fighterId);
                  const role =
                    TEAM_ROLES.find((candidate) => candidate.key === result.role) ??
                    TEAM_ROLES[0];
                  const RoleIcon = role.icon;
                  return (
                    <span key={result.fighterId}>
                      <RoleIcon aria-hidden="true" />
                      <span>
                        <small>{role.label}</small>
                        <strong>
                          {member?.nickname || member?.entry.name || role.label}
                        </strong>
                      </span>
                      <span>
                        <strong>{result.wins}-{result.losses}</strong>
                        <small>W-L · {result.averageRating} avg</small>
                      </span>
                    </span>
                  );
                })}
              </div>

              {fieldLosses.length > 0 && (
                <div className="pvp-team-field-losses">
                  <strong>Hard field losses</strong>
                  <div>
                    {fieldLosses.slice(0, 6).map((opponent) => {
                      const candidate = fieldCandidateByKey.get(opponent.fighterId);
                      const bestMember = candidatesByKey.get(opponent.bestMemberId);
                      if (!candidate || !bestMember) return null;
                      return (
                        <button
                          type="button"
                          key={opponent.fighterId}
                          onClick={() =>
                            onTestMatchup(bestMember.key, candidate.key)}
                        >
                          <img
                            src={resolveAssetUrl(candidate.entry.imageUrl)}
                            alt=""
                            draggable={false}
                          />
                          <span>
                            <strong>{candidate.entry.name}</strong>
                            <small>
                              Best answer {bestMember.nickname ||
                                bestMember.entry.name} · {opponent.bestRating}
                            </small>
                          </span>
                          <FaFlask aria-hidden="true" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {analysis.recommendations.length > 0 && team.length < TEAM_SIZE && (
            <div className="pvp-team-suggestions">
              <strong>Best additions for {activeRole.label}</strong>
              <div>
                {analysis.recommendations.map(({ candidate, covers }) => (
                  <button
                    type="button"
                    key={candidate.key}
                    onClick={() => chooseMember(candidate.key)}
                  >
                    <img
                      src={resolveAssetUrl(candidate.entry.imageUrl)}
                      alt=""
                      draggable={false}
                    />
                    <span>
                      <strong>{candidate.entry.name}</strong>
                      <small>
                        Covers {covers.length} open threat
                        {covers.length === 1 ? '' : 's'}
                      </small>
                    </span>
                    <FaPlus aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {analysis.replacements.length > 0 && team.length === TEAM_SIZE && (
            <div className="pvp-team-suggestions pvp-team-replacements">
              <strong>Stronger coverage swaps</strong>
              <div>
                {analysis.replacements.map((replacement) => {
                  const slot = selectedKeys.indexOf(replacement.replaceKey);
                  if (slot < 0) return null;
                  const role = TEAM_ROLES[slot];
                  return (
                    <button
                      type="button"
                      key={`${replacement.candidate.key}-${replacement.replaceKey}`}
                      onClick={() => {
                        setActiveSlot(slot);
                        chooseMember(replacement.candidate.key, slot);
                      }}
                    >
                      <img
                        src={resolveAssetUrl(replacement.candidate.entry.imageUrl)}
                        alt=""
                        draggable={false}
                      />
                      <span>
                        <strong>{replacement.candidate.entry.name}</strong>
                        <small>
                          Replace {role.label} · closes {replacement.improvement}{' '}
                          gap{replacement.improvement === 1 ? '' : 's'}
                        </small>
                      </span>
                      <FaExchangeAlt aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {hasMatchupEvidence && (
            <details className="pvp-team-evidence">
              <summary>
                <span>Published matchup evidence</span>
                <strong>{analysis.exposedThreats.length} open</strong>
              </summary>
              <div className="pvp-threat-list">
                {analysis.threats.slice(0, 10).map((threat) => {
                  const opponent = entriesBySpeciesId.get(threat.speciesId);
                  const testMemberKey =
                    threat.coveredByKeys[0] ??
                    threat.affectedKeys[0] ??
                    team[0]?.key;
                  return (
                    <article
                      key={threat.speciesId}
                      className={
                        threat.coveredByKeys.length > 0 ? 'covered' : 'open'
                      }
                    >
                      {opponent?.imageUrl && (
                        <img
                          src={resolveAssetUrl(opponent.imageUrl)}
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
                      {testMemberKey && opponent && (
                        <button
                          type="button"
                          aria-label={`Test ${threatName(threat.speciesId)} in Battle Lab`}
                          onClick={() =>
                            onTestMatchup(testMemberKey, opponent.speciesId)}
                        >
                          <FaFlask aria-hidden="true" />
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
            </details>
          )}

          {!hasMatchupEvidence && !teamEvaluation && (
            <p>
              Matchup evidence will appear after the detailed ranking snapshot
              is loaded.
            </p>
          )}
        </section>
      )}

      <section className="pvp-team-picks">
        <header>
          <span>
            <small>Choosing role</small>
            <strong>{activeRole.label}</strong>
          </span>
          <small>{team.length === TEAM_SIZE ? 'Select to replace' : 'Highest scoring first'}</small>
        </header>
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
            const selectedSlot = selectedKeys.indexOf(candidate.key);
            const selectedRole =
              selectedSlot >= 0 ? TEAM_ROLES[selectedSlot] : activeRole;
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
                  aria-label={
                    isSelected
                      ? `Unassign ${candidate.nickname || candidate.entry.name} from ${selectedRole.label}`
                      : `${team.length === TEAM_SIZE ? 'Replace' : 'Select'} ${
                        activeRole.label
                      } with ${candidate.nickname || candidate.entry.name}`
                  }
                  onClick={() => chooseMember(candidate.key)}
                >
                  {isSelected ? <FaCheck aria-hidden="true" /> : <FaPlus aria-hidden="true" />}
                </button>
              </article>
            );
          })}
        </div>

        {candidates.length > CANDIDATE_LIMIT && !query && (
          <small>
            Showing the {CANDIDATE_LIMIT} highest-scoring choices. Search to
            reach the full ranking.
          </small>
        )}
      </section>
    </section>
  );
};

export default PvpTeamBuilder;
