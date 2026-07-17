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
): string[] =>
  selectLegalRaidTeamCounters(scores).map(getRaidPartyScoreKey);

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
