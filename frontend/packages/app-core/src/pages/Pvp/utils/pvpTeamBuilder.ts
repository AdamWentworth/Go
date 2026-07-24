import type { PokemonPvPRankingEntry } from '@shared-contracts/pokemon';

export type PvPTeamCandidate = {
  key: string;
  entry: PokemonPvPRankingEntry;
  cp?: number;
  nickname?: string | null;
};

export type PvPTeamThreat = {
  speciesId: string;
  affectedKeys: string[];
  coveredByKeys: string[];
  worstRating: number;
};

export type PvPTeamRecommendation = {
  candidate: PvPTeamCandidate;
  covers: string[];
};

export type PvPTeamAnalysis = {
  threats: PvPTeamThreat[];
  exposedThreats: PvPTeamThreat[];
  coveredThreats: PvPTeamThreat[];
  recommendations: PvPTeamRecommendation[];
};

const matchupSpecies = (
  entry: PokemonPvPRankingEntry,
  kind: 'matchups' | 'counters',
): Set<string> =>
  new Set((entry[kind] ?? []).map((matchup) => matchup.speciesId));

export const formatPvPSpeciesName = (speciesId: string): string =>
  speciesId
    .replace(/_shadow$/, ' Shadow')
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

export const rankPvPTeamCandidates = (
  candidates: readonly PvPTeamCandidate[],
): PvPTeamCandidate[] =>
  [...candidates].sort((left, right) => (
    right.entry.score - left.entry.score ||
    left.entry.rank - right.entry.rank ||
    left.entry.name.localeCompare(right.entry.name) ||
    left.key.localeCompare(right.key)
  ));

export const analyzePvPTeam = (
  team: PvPTeamCandidate[],
  candidates: PvPTeamCandidate[],
): PvPTeamAnalysis => {
  const threatsBySpecies = new Map<string, PvPTeamThreat>();

  for (const member of team) {
    for (const counter of member.entry.counters ?? []) {
      const threat = threatsBySpecies.get(counter.speciesId) ?? {
        speciesId: counter.speciesId,
        affectedKeys: [],
        coveredByKeys: [],
        worstRating: counter.rating,
      };
      threat.affectedKeys.push(member.key);
      threat.worstRating = Math.min(threat.worstRating, counter.rating);
      threatsBySpecies.set(counter.speciesId, threat);
    }
  }

  for (const threat of threatsBySpecies.values()) {
    for (const member of team) {
      if (matchupSpecies(member.entry, 'matchups').has(threat.speciesId)) {
        threat.coveredByKeys.push(member.key);
      }
    }
  }

  const threats = [...threatsBySpecies.values()].sort(
    (left, right) =>
      right.affectedKeys.length - left.affectedKeys.length ||
      left.coveredByKeys.length - right.coveredByKeys.length ||
      left.worstRating - right.worstRating ||
      left.speciesId.localeCompare(right.speciesId),
  );
  const exposedThreats = threats.filter((threat) => threat.coveredByKeys.length === 0);
  const coveredThreats = threats.filter((threat) => threat.coveredByKeys.length > 0);
  const selectedKeys = new Set(team.map((member) => member.key));
  const exposedIds = new Set(exposedThreats.map((threat) => threat.speciesId));
  const recommendations = candidates
    .filter((candidate) => !selectedKeys.has(candidate.key))
    .map((candidate) => ({
      candidate,
      covers: [...matchupSpecies(candidate.entry, 'matchups')]
        .filter((speciesId) => exposedIds.has(speciesId)),
    }))
    .filter((recommendation) => recommendation.covers.length > 0)
    .sort(
      (left, right) =>
        right.covers.length - left.covers.length ||
        right.candidate.entry.score - left.candidate.entry.score ||
        left.candidate.entry.rank - right.candidate.entry.rank,
    )
    .slice(0, 5);

  return {
    threats,
    exposedThreats,
    coveredThreats,
    recommendations,
  };
};
