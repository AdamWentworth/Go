import type { NativeCombatEntry, NativeRaidBossEntry } from './nativeBattleModels';
import {
  RAID_TIER_PRESETS,
  resolveRaidTierKey,
  type RaidTierPreset,
} from '@pokemongonexus/shared-domain/raid-rules';

export type NativeRaidTier = RaidTierPreset;

export type NativeRaidGroupEstimate = {
  comfortableTrainers: number;
  minimumTrainers: number;
  projectedTimeSeconds: number;
  teamDps: number;
};

export type NativeRaidPartyTrainerDraft = {
  actionDelaySeconds: 0 | .5 | 1;
  dodgeStrategy: 'none' | 'charged';
  dodgeSuccessRate: .25 | .5 | .75 | 1;
  id: string;
  label: string;
  memberIds: string[];
  relobbySeconds: 5 | 10 | 15 | 20;
};

export type NativeRaidPartyTrainerResult = {
  damageShare: number;
  dps: number;
  id: string;
  label: string;
};

export type NativeRaidPartyResult = {
  clears: boolean;
  dps: number;
  faints: number;
  relobbies: number;
  seconds: number;
  trainers: NativeRaidPartyTrainerResult[];
};

export const resolveNativeRaidTier = (boss: NativeRaidBossEntry | null): NativeRaidTier => {
  if (boss?.tier) return boss.tier;
  const tier = String(boss?.boss.tier || boss?.boss.type || '5');
  const context = [boss?.name, boss?.boss.form, boss?.boss.type].filter(Boolean).join(' ');
  return RAID_TIER_PRESETS[resolveRaidTierKey(tier, context)];
};

export const getNativeRaidTeam = (scores: NativeCombatEntry[]): NativeCombatEntry[] => {
  const seen = new Set<string>();
  return scores.filter((score) => {
    const key = score.sourceInstanceId ?? String(score.pokemonId);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 6);
};

export const createNativeRaidPartyTrainer = (
  index: number,
  scores: NativeCombatEntry[],
): NativeRaidPartyTrainerDraft => ({
  actionDelaySeconds: 0,
  dodgeStrategy: 'none',
  dodgeSuccessRate: 1,
  id: `trainer-${index + 1}`,
  label: `Trainer ${index + 1}`,
  memberIds: getNativeRaidTeam(scores).map((entry) => entry.id),
  relobbySeconds: 10,
});

export const createNativeRaidParty = (
  scores: NativeCombatEntry[],
  trainerCount = 2,
): NativeRaidPartyTrainerDraft[] => Array.from(
  { length: Math.max(1, Math.min(20, trainerCount)) },
  (_, index) => createNativeRaidPartyTrainer(index, scores),
);

export const optimizeNativeRaidParty = (
  trainers: NativeRaidPartyTrainerDraft[],
  scores: NativeCombatEntry[],
): NativeRaidPartyTrainerDraft[] => {
  const defaultIds = getNativeRaidTeam(scores).map((entry) => entry.id);
  return trainers.map((trainer) => ({ ...trainer, memberIds: defaultIds }));
};

const partyTrainerDps = (
  trainer: NativeRaidPartyTrainerDraft,
  scoreById: Map<string, NativeCombatEntry>,
): number => {
  const members = trainer.memberIds.flatMap((id) => scoreById.get(id) ?? []);
  if (members.length === 0) return 0;
  const base = members.reduce((sum, member) => sum + member.score, 0) / members.length;
  const dodgeDelay = trainer.dodgeStrategy === 'charged' ? .94 : 1;
  const actionDelay = 1 / (1 + trainer.actionDelaySeconds * .09);
  const relobbyUptime = 180 / (180 + trainer.relobbySeconds);
  return base * dodgeDelay * actionDelay * relobbyUptime;
};

export const simulateNativeRaidParty = (
  trainers: NativeRaidPartyTrainerDraft[],
  scores: NativeCombatEntry[],
  tier: NativeRaidTier,
): NativeRaidPartyResult => {
  const scoreById = new Map(scores.map((entry) => [entry.id, entry]));
  const trainerDps = trainers.map((trainer) => ({ trainer, dps: partyTrainerDps(trainer, scoreById) }));
  const dps = trainerDps.reduce((sum, row) => sum + row.dps, 0);
  const seconds = dps > 0 ? tier.bossHp / dps : Infinity;
  const totalTdo = trainers.reduce((sum, trainer) => sum + trainer.memberIds.reduce((teamSum, id) => teamSum + (scoreById.get(id)?.tdo ?? 0), 0), 0);
  const faintCycles = totalTdo > 0 ? Math.max(0, tier.bossHp / totalTdo - 1) : 0;
  return {
    clears: Number.isFinite(seconds) && seconds <= tier.timeLimitSeconds,
    dps,
    faints: Math.max(0, Math.round(faintCycles * trainers.length * 6)),
    relobbies: Math.max(0, Math.floor(faintCycles) * trainers.length),
    seconds,
    trainers: trainerDps.map(({ trainer, dps: trainerDamage }) => ({
      damageShare: dps > 0 ? trainerDamage / dps : 0,
      dps: trainerDamage,
      id: trainer.id,
      label: trainer.label,
    })),
  };
};

export const estimateNativeRaidGroup = (
  scores: NativeCombatEntry[],
  tier: NativeRaidTier,
): NativeRaidGroupEstimate => {
  const team = getNativeRaidTeam(scores);
  const teamDps = team.length > 0
    ? team.reduce((total, score) => total + score.score, 0) / team.length
    : 0;
  if (teamDps <= 0) return { comfortableTrainers: 0, minimumTrainers: 0, projectedTimeSeconds: Infinity, teamDps: 0 };
  const projectedTimeSeconds = tier.bossHp / teamDps;
  const minimumTrainers = Math.max(1, Math.ceil(projectedTimeSeconds / tier.timeLimitSeconds));
  const comfortableTrainers = Math.max(minimumTrainers, Math.ceil(projectedTimeSeconds / (tier.timeLimitSeconds * .68)));
  return { comfortableTrainers, minimumTrainers, projectedTimeSeconds, teamDps };
};

export const simulateNativeRaidLobby = (
  estimate: NativeRaidGroupEstimate,
  tier: NativeRaidTier,
  trainerCount: number,
) => {
  const safeTrainerCount = Math.max(1, Math.round(trainerCount));
  const dps = estimate.teamDps * safeTrainerCount;
  const seconds = dps > 0 ? tier.bossHp / dps : Infinity;
  return {
    clears: Number.isFinite(seconds) && seconds <= tier.timeLimitSeconds,
    dps,
    seconds,
    trainerCount: safeTrainerCount,
  };
};
