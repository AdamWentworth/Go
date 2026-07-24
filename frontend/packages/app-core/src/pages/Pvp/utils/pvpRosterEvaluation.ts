import type {
  PokemonPvPRankingEntry,
  PokemonPvPRosterEvaluationResponse,
} from '@shared-contracts/pokemon';
import type { PokemonVariant } from '@/types/pokemonVariants';

import {
  type OwnedPvPRankingEntry,
  toPvPRankingMove,
} from './pvpRoster';
import { buildPvPBattleFighter, buildPvPEntryFighter } from './pvpBattleLab';
import type { PvPRosterWorkerRequest } from './pvpRosterWorkerProtocol';

export const PVP_REFERENCE_FIELD_SIZE = 12;
export const PVP_LOCAL_EVALUATION_MODEL_VERSION = 1;

export type PvPRosterEvaluationPlan = {
  request: PvPRosterWorkerRequest;
  cacheKey: string;
};

const sourceOrder = (
  left: PokemonPvPRankingEntry,
  right: PokemonPvPRankingEntry,
): number =>
  left.sourceRank - right.sourceRank ||
  left.rank - right.rank ||
  left.speciesId.localeCompare(right.speciesId);

const normalize = (value: unknown): string =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

const buildMoveMechanicsLookup = (
  variants: readonly PokemonVariant[],
): Map<string, ReturnType<typeof toPvPRankingMove>> => {
  const lookup = new Map<string, ReturnType<typeof toPvPRankingMove>>();
  for (const variant of variants) {
    for (const move of variant.moves ?? []) {
      const hydrated = toPvPRankingMove(
        move,
        Number(move.is_fast) === 1 ? 'fast' : 'charged',
      );
      lookup.set(normalize(move.name), hydrated);
    }
  }
  return lookup;
};

const hydrateRankingEntry = (
  entry: PokemonPvPRankingEntry,
  moveLookup: ReadonlyMap<string, ReturnType<typeof toPvPRankingMove>>,
): PokemonPvPRankingEntry => ({
  ...entry,
  moveset: entry.moveset.map((move) => {
    const mechanics = moveLookup.get(normalize(move.name));
    return mechanics
      ? {
        ...move,
        power: mechanics.power,
        energyGain: mechanics.energyGain,
        energyCost: mechanics.energyCost,
        turns: mechanics.turns,
        buff: mechanics.buff,
      }
      : move;
  }),
});

const hash = (value: string, seed: number): string => {
  let result = seed >>> 0;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return (result >>> 0).toString(16).padStart(8, '0');
};

export const buildPvPRosterEvaluationPlan = (
  owned: readonly OwnedPvPRankingEntry[],
  rankings: readonly PokemonPvPRankingEntry[],
  variants: readonly PokemonVariant[],
  formatKey: string,
): PvPRosterEvaluationPlan | null => {
  const moveLookup = buildMoveMechanicsLookup(variants);
  const candidates = owned.flatMap((item) => {
    const fighter = buildPvPBattleFighter({
      key: item.instanceId,
      entry: item.entry,
      cp: item.cp,
      nickname: item.nickname,
    });
    const hydratedReference = hydrateRankingEntry(
      item.referenceEntry,
      moveLookup,
    );
    const referenceFighter = buildPvPEntryFighter(
      hydratedReference,
      `reference:${item.instanceId}`,
    );
    if (!fighter || !referenceFighter) return [];
    return [{
      fighter,
      referenceFighter,
      sourceScore: item.referenceEntry.score,
      sourceCategoryScores: [...item.referenceEntry.categoryScores],
    }];
  });
  const opponents = [...rankings]
    .sort(sourceOrder)
    .map((entry) => ({
      entry,
      fighter: buildPvPEntryFighter(
        hydrateRankingEntry(entry, moveLookup),
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

  const request: PvPRosterWorkerRequest = {
    kind: 'evaluate',
    candidates,
    opponents,
  };
  const fingerprint = JSON.stringify(request);
  return {
    request,
    cacheKey: [
      `v${PVP_LOCAL_EVALUATION_MODEL_VERSION}`,
      formatKey,
      hash(fingerprint, 2166136261),
      hash(fingerprint, 2654435769),
    ].join(':'),
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
