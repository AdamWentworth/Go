import type { NativeCombatEntry, NativeRaidBossEntry } from './nativeBattleModels';

export type NativeRaidTier = {
  hp: number;
  key: string;
  label: string;
  note: string;
  timeLimitSeconds: number;
};

export type NativeRaidGroupEstimate = {
  comfortableTrainers: number;
  minimumTrainers: number;
  projectedTimeSeconds: number;
  teamDps: number;
};

const TIERS: Record<string, NativeRaidTier> = {
  'one-star': { hp: 600, key: 'tier1', label: 'One-star Raid', note: 'Entry-level raid with a 180-second timer.', timeLimitSeconds: 180 },
  'three-star': { hp: 3600, key: 'tier3', label: 'Three-star Raid', note: 'Standard three-star raid with a 180-second timer.', timeLimitSeconds: 180 },
  mega: { hp: 9000, key: 'mega', label: 'Mega Raid', note: 'Mega raid with a 300-second timer.', timeLimitSeconds: 300 },
  legendary: { hp: 15000, key: 'legendary', label: 'Legendary Raid', note: 'Five-star raid with a 300-second timer.', timeLimitSeconds: 300 },
  'five-star': { hp: 15000, key: 'legendary', label: 'Legendary Raid', note: 'Five-star raid with a 300-second timer.', timeLimitSeconds: 300 },
  'shadow-one-star': { hp: 600, key: 'shadow-tier1', label: 'Shadow One-star Raid', note: 'Shadow raid with enrage and Purified Gem mechanics.', timeLimitSeconds: 180 },
  'shadow-three-star': { hp: 3600, key: 'shadow-tier3', label: 'Shadow Three-star Raid', note: 'Shadow raid with enrage and Purified Gem mechanics.', timeLimitSeconds: 180 },
  'shadow-five-star': { hp: 15000, key: 'shadow-legendary', label: 'Shadow Legendary Raid', note: 'Shadow raid with enrage and Purified Gem mechanics.', timeLimitSeconds: 300 },
};

const normalizeTier = (value: string): string => value.trim().toLocaleLowerCase().replace(/[_\s]+/g, '-');

export const resolveNativeRaidTier = (boss: NativeRaidBossEntry | null): NativeRaidTier => {
  const normalized = normalizeTier(String(boss?.boss.tier || boss?.boss.type || 'legendary'));
  if (TIERS[normalized]) return TIERS[normalized];
  if (normalized.includes('shadow') && (normalized.includes('legend') || normalized.includes('five'))) return TIERS['shadow-five-star'];
  if (normalized.includes('shadow') && normalized.includes('three')) return TIERS['shadow-three-star'];
  if (normalized.includes('shadow')) return TIERS['shadow-one-star'];
  if (normalized.includes('mega') || normalized.includes('primal')) return TIERS.mega;
  if (normalized.includes('legend') || normalized.includes('five')) return TIERS.legendary;
  if (normalized.includes('three')) return TIERS['three-star'];
  return TIERS['one-star'];
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

export const estimateNativeRaidGroup = (
  scores: NativeCombatEntry[],
  tier: NativeRaidTier,
): NativeRaidGroupEstimate => {
  const team = getNativeRaidTeam(scores);
  const teamDps = team.length > 0
    ? team.reduce((total, score) => total + score.score, 0) / team.length
    : 0;
  if (teamDps <= 0) return { comfortableTrainers: 0, minimumTrainers: 0, projectedTimeSeconds: Infinity, teamDps: 0 };
  const projectedTimeSeconds = tier.hp / teamDps;
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
  const seconds = dps > 0 ? tier.hp / dps : Infinity;
  return {
    clears: Number.isFinite(seconds) && seconds <= tier.timeLimitSeconds,
    dps,
    seconds,
    trainerCount: safeTrainerCount,
  };
};
