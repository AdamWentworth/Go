import type {
  RaidCounterScore,
  RaidCounterSettings,
  RaidPartyTrainer,
} from "./raidTypes";
import { RAID_ATTACKER_TEAM_SIZE } from "./raidRules";
import {
  preserveLegalRaidTeamOrder,
  selectLegalRaidTeamCounters,
} from "./raidTeamSelection";

export type RaidPartyTrainerDraft = {
  id: string;
  label: string;
  memberVariantIds: string[];
  dodgeStrategy: RaidCounterSettings["dodgeStrategy"];
  dodgeSuccessRate: number;
  relobbySeconds: number;
  actionDelaySeconds: number;
};

export const getRaidPartyScoreKey = (score: RaidCounterScore): string =>
  score.variant.variant_id;

export const getDefaultRaidPartyMemberIds = (
  scores: RaidCounterScore[],
): string[] => selectLegalRaidTeamCounters(scores).map(getRaidPartyScoreKey);

export const createRaidPartyTrainerDraft = (
  index: number,
  scores: RaidCounterScore[],
  settings: RaidCounterSettings,
): RaidPartyTrainerDraft => ({
  id: `trainer-${index + 1}`,
  label: `Trainer ${index + 1}`,
  memberVariantIds: getDefaultRaidPartyMemberIds(scores),
  dodgeStrategy: settings.dodgeStrategy,
  dodgeSuccessRate: settings.dodgeSuccessRate ?? 1,
  relobbySeconds: settings.relobbySeconds,
  actionDelaySeconds: 0,
});

export const buildRaidPartyTrainer = (
  draft: RaidPartyTrainerDraft,
  scores: RaidCounterScore[],
  settings: RaidCounterSettings,
): RaidPartyTrainer | null => {
  const scoresById = new Map(
    scores.map((score) => [getRaidPartyScoreKey(score), score]),
  );
  const requested = draft.memberVariantIds
    .map((id) => scoresById.get(id))
    .filter((score): score is RaidCounterScore => Boolean(score));
  const legalTeam = preserveLegalRaidTeamOrder(
    requested,
    RAID_ATTACKER_TEAM_SIZE,
  );
  if (legalTeam.length === 0) return null;

  return {
    id: draft.id,
    label: draft.label.trim() || "Trainer",
    team: legalTeam.map(({ variant, fastMove, chargedMove }) => ({
      attacker: variant,
      fastMove,
      chargedMove,
    })),
    settings: {
      ...settings,
      dodgeStrategy: draft.dodgeStrategy,
      dodgeSuccessRate: Math.min(1, Math.max(0, draft.dodgeSuccessRate)),
      relobbySeconds: Math.max(0, draft.relobbySeconds),
      megaAllyBonus: "none",
    },
    actionDelaySeconds: Math.max(0, draft.actionDelaySeconds),
  };
};

export const buildRaidPartyTrainers = (
  drafts: RaidPartyTrainerDraft[],
  scores: RaidCounterScore[],
  settings: RaidCounterSettings,
): RaidPartyTrainer[] =>
  drafts
    .map((draft) => buildRaidPartyTrainer(draft, scores, settings))
    .filter((trainer): trainer is RaidPartyTrainer => Boolean(trainer));

const hashRaidPartyScenario = (value: string): string => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};

export const getRaidPartyScenarioKey = (
  trainers: RaidPartyTrainer[],
): string => {
  const serialized = trainers
    .map((trainer) =>
      [
        trainer.settings.friendship,
        trainer.settings.partyPower,
        trainer.settings.dodgeStrategy,
        trainer.settings.dodgeSuccessRate ?? 1,
        trainer.settings.relobbySeconds,
        trainer.actionDelaySeconds,
        ...trainer.team.map(
          ({ attacker, fastMove, chargedMove }) =>
            `${attacker.variant_id}:${fastMove.name}:${chargedMove.name}`,
        ),
      ].join(":"),
    )
    .join("|");
  return `party-${trainers.length}-${hashRaidPartyScenario(serialized)}`;
};

export const applyRaidPartyTrainersToDrafts = (
  drafts: RaidPartyTrainerDraft[],
  trainers: RaidPartyTrainer[],
): RaidPartyTrainerDraft[] => {
  const trainersById = new Map(
    trainers.map((trainer) => [trainer.id, trainer]),
  );
  return drafts.map((draft) => {
    const trainer = trainersById.get(draft.id);
    if (!trainer) return draft;
    return {
      ...draft,
      memberVariantIds: trainer.team.map(({ attacker }) => attacker.variant_id),
    };
  });
};
