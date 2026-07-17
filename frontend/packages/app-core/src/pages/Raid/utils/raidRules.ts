import type {
  FriendshipKey,
  MegaAllyBonusKey,
  PartyPowerKey,
  RaidNeutralBenchmark,
  RaidOverallTargetProfile,
  RaidTierKey,
  RaidTierPreset,
} from "./raidTypes";

export const RAID_TIER_PRESETS: Record<RaidTierKey, RaidTierPreset> = {
  tier1: {
    key: "tier1",
    label: "One-star Raid",
    shortLabel: "1-star",
    bossHp: 600,
    bossStatMultiplier: 0.5974,
    timeLimitSeconds: 180,
    note: "Low HP Gym raid, usually soloable.",
  },
  tier3: {
    key: "tier3",
    label: "Three-star Raid",
    shortLabel: "3-star",
    bossHp: 3600,
    bossStatMultiplier: 0.73,
    timeLimitSeconds: 180,
    note: "Mid-tier Gym raid with the post-2020 reward tier.",
  },
  "community-day": {
    key: "community-day",
    label: "Community Day Raid",
    shortLabel: "4-star",
    bossHp: 9000,
    bossStatMultiplier: 0.79,
    timeLimitSeconds: 180,
    note: "Local-only post-Community-Day style raid.",
  },
  mega: {
    key: "mega",
    label: "Mega Raid",
    shortLabel: "Mega",
    bossHp: 9000,
    bossStatMultiplier: 0.79,
    timeLimitSeconds: 300,
    note: "Standard Mega raid awarding Mega Energy by speed.",
  },
  legendary: {
    key: "legendary",
    label: "Legendary Raid",
    shortLabel: "5-star",
    bossHp: 15000,
    bossStatMultiplier: 0.79,
    timeLimitSeconds: 300,
    note: "Normal five-star Legendary, Ultra Beast, or Fusion raid baseline.",
  },
  elite: {
    key: "elite",
    label: "Elite Raid",
    shortLabel: "Elite",
    bossHp: 20000,
    bossStatMultiplier: 0.79,
    timeLimitSeconds: 300,
    note: "Local-only Elite raid durability.",
  },
  primal: {
    key: "primal",
    label: "Primal Raid",
    shortLabel: "Primal",
    bossHp: 22500,
    bossStatMultiplier: 0.79,
    timeLimitSeconds: 300,
    note: "Primal Groudon and Primal Kyogre durability.",
  },
  "legendary-mega": {
    key: "legendary-mega",
    label: "Mega Legendary Raid",
    shortLabel: "Mega Legendary",
    bossHp: 22500,
    bossStatMultiplier: 0.79,
    timeLimitSeconds: 300,
    note: "Legendary or Mythical Mega raid durability.",
  },
  "super-mega": {
    key: "super-mega",
    label: "Super Mega Raid",
    shortLabel: "Super Mega",
    bossHp: 25000,
    bossStatMultiplier: 0.79,
    timeLimitSeconds: 300,
    note: "Shielded Super Mega baseline before shield pacing.",
  },
  "shadow-tier1": {
    key: "shadow-tier1",
    label: "Shadow One-star Raid",
    shortLabel: "Shadow 1-star",
    bossHp: 600,
    bossStatMultiplier: 0.5974,
    timeLimitSeconds: 180,
    note: "Team GO Rocket one-star Shadow raid with enrage and Purified Gem mechanics.",
  },
  "shadow-tier3": {
    key: "shadow-tier3",
    label: "Shadow Three-star Raid",
    shortLabel: "Shadow 3-star",
    bossHp: 3600,
    bossStatMultiplier: 0.73,
    timeLimitSeconds: 180,
    note: "Team GO Rocket three-star Shadow raid with enrage and Purified Gem mechanics.",
  },
  "shadow-legendary": {
    key: "shadow-legendary",
    label: "Shadow Legendary Raid",
    shortLabel: "Shadow 5-star",
    bossHp: 15000,
    bossStatMultiplier: 0.79,
    timeLimitSeconds: 300,
    note: "Five-star Shadow Legendary raid with enrage and Purified Gem mechanics.",
  },
};

export const FRIENDSHIP_DAMAGE_BONUS: Record<FriendshipKey, number> = {
  none: 1,
  good: 1.03,
  great: 1.05,
  ultra: 1.07,
  best: 1.1,
};

export const MEGA_ALLY_DAMAGE_BONUS: Record<MegaAllyBonusKey, number> = {
  none: 1,
  general: 1.1,
  matching: 1.3,
};

export const PARTY_POWER_CHARGED_DAMAGE_BONUS: Record<PartyPowerKey, number> = {
  none: 1,
  occasional: 1.18,
  frequent: 1.35,
  every: 2,
};

export const SHADOW_ATTACKER_DAMAGE_BONUS = 1.2;
export const SHADOW_ATTACKER_DEFENSE_MULTIPLIER = 0.8333333;
export const WEATHER_DAMAGE_BONUS = 1.2;
export const STAB_DAMAGE_BONUS = 1.2;
export const SHADOW_BOSS_ENRAGED_ATTACK_MULTIPLIER = 1.81;
export const SHADOW_BOSS_ENRAGED_DEFENSE_MULTIPLIER = 3;
export const RAID_SAFETY_FACTOR = 0.82;
export const COMFORTABLE_SAFETY_FACTOR = 0.68;
export const TYPE_DPS_TARGET_DEFENSE = 180;
export const TYPE_DPS_INCOMING_DAMAGE_NUMERATOR = 1340;
export const TYPE_DPS_INCOMING_CHARGED_DAMAGE_NUMERATOR = 11670;
export const TYPE_DPS_ER_TDO_EXPONENT = 0.25;
export const DEFAULT_RAID_NEUTRAL_BENCHMARK: RaidNeutralBenchmark = {
  targetDefense: TYPE_DPS_TARGET_DEFENSE,
  incomingDamageNumerator: TYPE_DPS_INCOMING_DAMAGE_NUMERATOR,
  incomingChargedDamageNumerator:
    TYPE_DPS_INCOMING_CHARGED_DAMAGE_NUMERATOR,
};
export const RAID_ATTACKER_TEAM_SIZE = 6;
export const DEFAULT_RAID_RELOBBY_SECONDS = 10;
export const RAID_BOSS_ACTION_DELAY_SECONDS = 1.75;
export const RAID_SIMULATION_BOSS_ACTION_DELAY_SECONDS = 2;
export const RAID_SIMULATION_ATTACKER_SWAP_SECONDS = 1;
export const RAID_SIMULATION_ENERGY_CAP = 100;
export const RAID_COUNTER_SIMULATION_VARIANT_LIMIT = 256;
export const RAID_COUNTER_SIMULATION_MOVESET_LIMIT = 3;
export const LEGACY_RAID_TIERS = new Set(["2"]);
export const FALLBACK_OVERALL_TARGET_PROFILES: RaidOverallTargetProfile[] = [
  { types: [], weight: 1 },
];
