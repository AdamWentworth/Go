import type {
  PokemonPvPRankingEntry,
  PokemonPvPRosterEvaluationRequest,
  PokemonPvPRosterEvaluationResponse,
} from '@shared-contracts/pokemon';

import type { OwnedPvPRankingEntry } from './pvpRoster';
import { buildPvPBattleFighter, buildPvPEntryFighter } from './pvpBattleLab';

export const PVP_REFERENCE_FIELD_SIZE = 12;

export type PvPRosterEvaluationPlan = {
  request: PokemonPvPRosterEvaluationRequest;
  cacheKey: string;
};

const sourceOrder = (
  left: PokemonPvPRankingEntry,
  right: PokemonPvPRankingEntry,
): number =>
  left.sourceRank - right.sourceRank ||
  left.rank - right.rank ||
  left.speciesId.localeCompare(right.speciesId);

export const buildPvPRosterEvaluationPlan = (
  owned: readonly OwnedPvPRankingEntry[],
  rankings: readonly PokemonPvPRankingEntry[],
  formatKey: string,
): PvPRosterEvaluationPlan | null => {
  const candidates = owned
    .map((item) => buildPvPBattleFighter({
      key: item.instanceId,
      entry: item.entry,
      cp: item.cp,
      nickname: item.nickname,
    }))
    .filter((fighter): fighter is NonNullable<typeof fighter> => fighter != null);
  const opponents = [...rankings]
    .sort(sourceOrder)
    .map((entry) => ({
      entry,
      fighter: buildPvPEntryFighter(
        entry,
        `meta:${entry.speciesId}`,
      ),
    }))
    .filter(
      (
        item,
      ): item is {
        entry: PokemonPvPRankingEntry;
        fighter: NonNullable<typeof item.fighter>;
      } => item.fighter != null,
    )
    .slice(0, PVP_REFERENCE_FIELD_SIZE)
    .map(({ entry, fighter }) => ({
      fighter,
      weight: Math.max(0.25, Math.min(1, entry.score / 100)),
    }));

  if (candidates.length === 0 || opponents.length === 0) return null;

  const request: PokemonPvPRosterEvaluationRequest = {
    mechanics: 'pvpoke-legacy',
    candidates,
    opponents,
  };
  return {
    request,
    cacheKey: `${formatKey}:${JSON.stringify(request)}`,
  };
};

export const applyPvPRosterEvaluation = (
  owned: readonly OwnedPvPRankingEntry[],
  response: PokemonPvPRosterEvaluationResponse | null,
): OwnedPvPRankingEntry[] => {
  if (!response) return [...owned];
  const results = new Map(
    response.results.map((result) => [result.fighterId, result]),
  );
  return owned.map((item) => {
    const result = results.get(item.instanceId);
    if (!result) return item;
    return {
      ...item,
      entry: {
        ...item.entry,
        score: result.score,
        categoryScores: [...result.categoryScores],
      },
    };
  });
};
