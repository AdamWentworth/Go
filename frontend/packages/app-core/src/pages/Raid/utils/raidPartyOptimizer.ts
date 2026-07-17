import {
  RAID_PARTY_OPTIMIZER_MAX_EVALUATIONS,
  RAID_PARTY_OPTIMIZER_MAX_TEAM_OPTIONS,
} from "./raidRules";
import { simulateHeterogeneousRaidPartyAcrossBossMovesets } from "./raidPartySimulation";
import {
  preserveLegalRaidTeamOrder,
  usesRaidMegaSlot,
} from "./raidTeamSelection";
import type {
  RaidCounterScore,
  RaidPartyOptimizationResult,
  RaidPartySimulationResult,
  RaidPartyTrainer,
  RaidSimulationTeamMember,
  RaidTierPreset,
} from "./raidTypes";
import type { PokemonVariant } from "@/types/pokemonVariants";

type RaidPartyEvaluator = (request: {
  trainers: RaidPartyTrainer[];
  boss: PokemonVariant;
  tier: RaidTierPreset;
}) => RaidPartySimulationResult | null;

const finiteOr = (value: number, fallback: number): number =>
  Number.isFinite(value) ? value : fallback;

const scoreToMember = ({
  variant,
  fastMove,
  chargedMove,
}: RaidCounterScore): RaidSimulationTeamMember => ({
  attacker: variant,
  fastMove,
  chargedMove,
});

const teamKey = (team: RaidSimulationTeamMember[]): string =>
  team
    .map(
      ({ attacker, fastMove, chargedMove }) =>
        `${attacker.variant_id}:${fastMove.name}:${chargedMove.name}`,
    )
    .join("|");

const buildForcedLeadTeam = (
  lead: RaidCounterScore,
  scores: RaidCounterScore[],
): RaidCounterScore[] =>
  preserveLegalRaidTeamOrder([
    lead,
    ...scores.filter(
      (score) => score.variant.variant_id !== lead.variant.variant_id,
    ),
  ]);

const addCandidate = (
  candidates: RaidSimulationTeamMember[][],
  seen: Set<string>,
  scores: RaidCounterScore[],
) => {
  const legal = preserveLegalRaidTeamOrder(scores);
  if (legal.length === 0) return;
  const team = legal.map(scoreToMember);
  const key = teamKey(team);
  if (seen.has(key)) return;
  seen.add(key);
  candidates.push(team);
};

export const buildRaidPartyTeamCandidates = (
  currentTeam: RaidSimulationTeamMember[],
  scores: RaidCounterScore[],
  limit = RAID_PARTY_OPTIMIZER_MAX_TEAM_OPTIONS,
): RaidSimulationTeamMember[][] => {
  const candidates: RaidSimulationTeamMember[][] = [];
  const seen = new Set<string>();
  const cappedScores = scores.slice(0, 48);
  const scoreByMemberKey = new Map(
    cappedScores.map((score) => [teamKey([scoreToMember(score)]), score]),
  );
  const currentScores = currentTeam
    .map((member) => scoreByMemberKey.get(teamKey([member])))
    .filter((score): score is RaidCounterScore => Boolean(score));

  addCandidate(candidates, seen, currentScores);
  addCandidate(candidates, seen, cappedScores);
  addCandidate(
    candidates,
    seen,
    [...cappedScores].sort(
      (a, b) =>
        finiteOr(a.faints, 999) - finiteOr(b.faints, 999) || b.dps - a.dps,
    ),
  );
  addCandidate(
    candidates,
    seen,
    [...cappedScores].sort(
      (a, b) =>
        finiteOr(a.relobbies, 999) - finiteOr(b.relobbies, 999) ||
        b.dps - a.dps,
    ),
  );

  const forcedLeads = [
    ...cappedScores.filter(usesRaidMegaSlot).slice(0, 5),
    ...cappedScores.slice(0, 5),
  ];
  forcedLeads.forEach((lead) =>
    addCandidate(candidates, seen, buildForcedLeadTeam(lead, cappedScores)),
  );

  const baseline = preserveLegalRaidTeamOrder(cappedScores);
  for (
    let rotation = 1;
    rotation < Math.min(4, baseline.length);
    rotation += 1
  ) {
    addCandidate(candidates, seen, [
      ...baseline.slice(rotation),
      ...baseline.slice(0, rotation),
    ]);
  }

  return candidates.slice(0, Math.max(1, limit));
};

export const compareRaidPartyResults = (
  candidate: RaidPartySimulationResult,
  current: RaidPartySimulationResult,
): number => {
  const winRateDifference =
    candidate.distribution.winRate - current.distribution.winRate;
  if (Math.abs(winRateDifference) > 0.0001) return winRateDifference;

  const timeDifference =
    finiteOr(current.projectedTimeToWinSeconds, Number.MAX_SAFE_INTEGER) -
    finiteOr(candidate.projectedTimeToWinSeconds, Number.MAX_SAFE_INTEGER);
  if (Math.abs(timeDifference) > 0.05) return timeDifference;

  const p90Difference =
    finiteOr(
      current.distribution.timeToWinSeconds.p90,
      Number.MAX_SAFE_INTEGER,
    ) -
    finiteOr(
      candidate.distribution.timeToWinSeconds.p90,
      Number.MAX_SAFE_INTEGER,
    );
  if (Math.abs(p90Difference) > 0.05) return p90Difference;

  const relobbyDifference = current.relobbies - candidate.relobbies;
  if (Math.abs(relobbyDifference) > 0.01) return relobbyDifference;

  const faintDifference = current.faints - candidate.faints;
  if (Math.abs(faintDifference) > 0.01) return faintDifference;

  return candidate.dps - current.dps;
};

const withExpectedSearchMode = (
  trainers: RaidPartyTrainer[],
): RaidPartyTrainer[] =>
  trainers.map((trainer) => ({
    ...trainer,
    settings: {
      ...trainer.settings,
      bossMovesetMode:
        trainer.settings.bossMovesetMode === "monte-carlo"
          ? "expected"
          : trainer.settings.bossMovesetMode,
    },
  }));

export const optimizeRaidParty = (
  {
    trainers,
    scores,
    boss,
    tier,
  }: {
    trainers: RaidPartyTrainer[];
    scores: RaidCounterScore[];
    boss: PokemonVariant;
    tier: RaidTierPreset;
  },
  evaluate: RaidPartyEvaluator = simulateHeterogeneousRaidPartyAcrossBossMovesets,
): RaidPartyOptimizationResult | null => {
  if (trainers.length === 0 || scores.length === 0) return null;

  const baselineResult = evaluate({ trainers, boss, tier });
  if (!baselineResult) return null;

  const optionLimit = Math.max(
    4,
    Math.min(
      RAID_PARTY_OPTIMIZER_MAX_TEAM_OPTIONS,
      Math.floor(
        (RAID_PARTY_OPTIMIZER_MAX_EVALUATIONS - 1) /
          Math.max(1, trainers.length * 2),
      ),
    ),
  );
  const optionsByTrainer = trainers.map((trainer) =>
    buildRaidPartyTeamCandidates(trainer.team, scores, optionLimit),
  );
  let evaluatedLineups = 1;
  let selectedTrainers = withExpectedSearchMode(trainers);
  let selectedResult = evaluate({ trainers: selectedTrainers, boss, tier });
  if (!selectedResult) return null;
  evaluatedLineups += 1;

  for (let pass = 0; pass < 2; pass += 1) {
    let passImproved = false;
    for (
      let trainerIndex = 0;
      trainerIndex < selectedTrainers.length;
      trainerIndex += 1
    ) {
      for (const team of optionsByTrainer[trainerIndex]) {
        if (evaluatedLineups >= RAID_PARTY_OPTIMIZER_MAX_EVALUATIONS - 1) break;
        if (teamKey(team) === teamKey(selectedTrainers[trainerIndex].team))
          continue;

        const trialTrainers = selectedTrainers.map((trainer, index) =>
          index === trainerIndex ? { ...trainer, team } : trainer,
        );
        const trialResult = evaluate({ trainers: trialTrainers, boss, tier });
        evaluatedLineups += 1;
        if (
          !trialResult ||
          compareRaidPartyResults(trialResult, selectedResult) <= 0
        ) {
          continue;
        }
        selectedTrainers = trialTrainers;
        selectedResult = trialResult;
        passImproved = true;
      }
      if (evaluatedLineups >= RAID_PARTY_OPTIMIZER_MAX_EVALUATIONS - 1) break;
    }
    if (
      !passImproved ||
      evaluatedLineups >= RAID_PARTY_OPTIMIZER_MAX_EVALUATIONS - 1
    ) {
      break;
    }
  }

  const optimizedTrainers = selectedTrainers.map((trainer, index) => ({
    ...trainer,
    settings: trainers[index].settings,
  }));
  const optimizedResult = evaluate({ trainers: optimizedTrainers, boss, tier });
  evaluatedLineups += 1;
  const useOptimized =
    optimizedResult != null &&
    compareRaidPartyResults(optimizedResult, baselineResult) > 0;
  const finalTrainers = useOptimized ? optimizedTrainers : trainers;
  const finalResult = useOptimized ? optimizedResult : baselineResult;

  return {
    trainers: finalTrainers,
    result: finalResult,
    baselineResult,
    evaluatedLineups,
    changedTrainerCount: finalTrainers.reduce(
      (count, trainer, index) =>
        count +
        (teamKey(trainer.team) === teamKey(trainers[index].team) ? 0 : 1),
      0,
    ),
    timeSavedSeconds: Math.max(
      0,
      finiteOr(baselineResult.projectedTimeToWinSeconds, 0) -
        finiteOr(finalResult.projectedTimeToWinSeconds, 0),
    ),
    faintReduction: Math.max(0, baselineResult.faints - finalResult.faints),
    relobbyReduction: Math.max(
      0,
      baselineResult.relobbies - finalResult.relobbies,
    ),
  };
};
