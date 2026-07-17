import type { PokemonVariant } from "@/types/pokemonVariants";
import type { Move } from "@/types/pokemonSubTypes";
import { cpMultipliers } from "./constants";

export type RaidTierKey =
  | "tier1"
  | "tier3"
  | "community-day"
  | "mega"
  | "legendary"
  | "elite"
  | "primal"
  | "legendary-mega"
  | "super-mega"
  | "shadow-tier1"
  | "shadow-tier3"
  | "shadow-legendary";

export type FriendshipKey = "none" | "good" | "great" | "ultra" | "best";
export type MegaAllyBonusKey = "none" | "general" | "matching";
export type PartyPowerKey = "none" | "occasional" | "frequent" | "every";
export type ShadowBossMode = "normal" | "enraged" | "subdued";
export type RaidBossMovesetMode = "expected" | "favorable" | "hostile";

export type RaidTierPreset = {
  key: RaidTierKey;
  label: string;
  shortLabel: string;
  bossHp: number;
  bossStatMultiplier: number;
  timeLimitSeconds: number;
  note: string;
};

export type RaidCounterSettings = {
  attackerLevel: keyof typeof cpMultipliers;
  friendship: FriendshipKey;
  megaAllyBonus: MegaAllyBonusKey;
  partyPower: PartyPowerKey;
  weatherBoostedType: string;
  shadowBossMode: ShadowBossMode;
  bossMovesetMode: RaidBossMovesetMode;
  relobbySeconds: number;
};

export type RaidBossStats = {
  bossCp: number;
  attack: number;
  defense: number;
  hp: number;
  timeLimitSeconds: number;
};

export type RaidCounterScore = {
  variant: PokemonVariant;
  fastMove: Move;
  chargedMove: Move;
  cp: number;
  dps: number;
  fastDamage: number;
  chargedDamage: number;
  cycleSeconds: number;
  cycleDamage: number;
  effectiveness: number;
  soloTimeSeconds: number;
  trainersNeeded: number;
};

export type RaidTypeDpsScore = {
  variant: PokemonVariant;
  fastMove: Move;
  chargedMove: Move;
  cp: number;
  totalDps: number;
  eDps: number;
  dps: number;
  tdo: number;
  er: number;
  fastDamage: number;
  chargedDamage: number;
  fastEffectiveness: number;
  chargedEffectiveness: number;
  cycleSeconds: number;
  cycleDamage: number;
  targetEffectiveness: number;
  fastMatchesType: boolean;
  chargedMatchesType: boolean;
};

export type RaidOverallScore = {
  variant: PokemonVariant;
  fastMove: Move;
  chargedMove: Move;
  cp: number;
  eDps: number;
  dps: number;
  tdo: number;
  er: number;
  fastDamage: number;
  chargedDamage: number;
  cycleSeconds: number;
  cycleDamage: number;
};

export type RaidOverallTargetProfile = {
  types: string[];
  weight: number;
  target?: PokemonVariant;
};

export type RaidGroupEstimate = {
  topTeamDps: number;
  minTrainers: number;
  comfortableTrainers: number;
  soloTimeSeconds: number;
};
