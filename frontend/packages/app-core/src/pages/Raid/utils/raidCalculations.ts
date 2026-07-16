import type { PokemonVariant } from "@/types/pokemonVariants";
import type { Move } from "@/types/pokemonSubTypes";
import { cpMultipliers, TYPE_MAPPING } from "./constants";
import { expandHiddenPowerFastMoves } from "./hiddenPower";
import { getTypeEffectivenessMultiplier } from "./typeEffectiveness";

type RaidBossMetadata = NonNullable<PokemonVariant["raid_boss"]>[number];

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

type RaidOverallTargetProfile = {
  types: string[];
  weight: number;
};

export type RaidGroupEstimate = {
  topTeamDps: number;
  minTrainers: number;
  comfortableTrainers: number;
  soloTimeSeconds: number;
};

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

const PARTY_POWER_CHARGED_DAMAGE_BONUS: Record<PartyPowerKey, number> = {
  none: 1,
  occasional: 1.18,
  frequent: 1.35,
  every: 2,
};

const SHADOW_ATTACKER_DAMAGE_BONUS = 1.2;
const SHADOW_ATTACKER_DEFENSE_MULTIPLIER = 0.8333333;
const WEATHER_DAMAGE_BONUS = 1.2;
const STAB_DAMAGE_BONUS = 1.2;
const SHADOW_BOSS_ENRAGED_ATTACK_MULTIPLIER = 1.81;
const SHADOW_BOSS_ENRAGED_DEFENSE_MULTIPLIER = 3;
const RAID_SAFETY_FACTOR = 0.82;
const COMFORTABLE_SAFETY_FACTOR = 0.68;
const TYPE_DPS_TARGET_DEFENSE = 180;
const TYPE_DPS_INCOMING_DAMAGE_NUMERATOR = 1340;
const TYPE_DPS_INCOMING_CHARGED_DAMAGE_NUMERATOR = 11670;
const TYPE_DPS_ER_TDO_EXPONENT = 0.25;
export const RAID_ATTACKER_TEAM_SIZE = 6;
export const DEFAULT_RAID_RELOBBY_SECONDS = 10;
const LEGACY_RAID_TIERS = new Set(["2"]);
const FALLBACK_OVERALL_TARGET_PROFILES: RaidOverallTargetProfile[] = [
  { types: [], weight: 1 },
];

const normalizeTypeName = (value?: string | null): string => {
  const normalized = value?.trim().toLowerCase() ?? "";
  return normalized === "none" || normalized === "unknown" ? "" : normalized;
};

const getRaidMovePower = (move: Move): number => move.raid_power;

const getRaidMoveEnergy = (move: Move): number => move.raid_energy;

const getRaidMoveCooldown = (move: Move): number => move.raid_cooldown;

export const getVariantTypeNames = (variant: PokemonVariant): string[] => {
  const type1 = normalizeTypeName(
    variant.type1_name ?? TYPE_MAPPING[variant.type_1_id]?.name,
  );
  const type2 = normalizeTypeName(
    variant.type2_name ?? TYPE_MAPPING[variant.type_2_id]?.name,
  );
  return [type1, type2].filter(Boolean);
};

export const isRaidCosmeticVariant = (variant: PokemonVariant): boolean => {
  const variantType = variant.variantType.toLowerCase();
  return variantType.includes("shiny") || variantType.startsWith("costume");
};

export const isMaxBattleVariant = (variant: PokemonVariant): boolean => {
  const variantType = variant.variantType.toLowerCase();
  return (
    variantType.includes("dynamax") || variantType.includes("gigantamax")
  );
};

const isRaidShinyVariant = (variant: PokemonVariant): boolean =>
  variant.variantType.toLowerCase().includes("shiny");

const getRaidMetadataCostumeId = (
  metadata: RaidBossMetadata,
): number | null => {
  const costumeId = Number(metadata.costume_id ?? 0);
  return Number.isFinite(costumeId) && costumeId > 0 ? costumeId : null;
};

const getVariantCostumeId = (variant: PokemonVariant): number | null => {
  const match = variant.variantType.toLowerCase().match(/(?:^|_)costume_(\d+)/);
  if (!match) return null;
  const costumeId = Number(match[1]);
  return Number.isFinite(costumeId) ? costumeId : null;
};

const normalizeRaidForm = (form?: string | null): string => {
  const normalized = form?.trim().toLowerCase() ?? "";
  if (!normalized || normalized === "default" || normalized === "normal")
    return "";
  if (normalized === "alola") return "alolan";
  if (normalized === "galar") return "galarian";
  return normalized;
};

const getRaidMetadataTierKey = (
  metadata: RaidBossMetadata,
  variant?: PokemonVariant,
): RaidTierKey | null => {
  const tier = metadata.tier?.toLowerCase() ?? "";
  if (!tier || LEGACY_RAID_TIERS.has(tier)) return null;
  if (tier === "shadow_1") return "shadow-tier1";
  if (tier === "shadow_3") return "shadow-tier3";
  if (tier === "shadow_5") return "shadow-legendary";
  if (tier === "fusion_5") return "legendary";
  if (tier === "super_mega") return "super-mega";
  if (tier === "mega_legendary")
    return variant?.primal ? "primal" : "legendary-mega";
  if (tier === "mega") return "mega";
  if (tier === "ex" || tier.includes("elite")) return "elite";
  if (tier === "6" || tier === "5" || tier.includes("legendary"))
    return "legendary";
  if (tier === "4") return "community-day";
  if (tier === "3") return "tier3";
  if (tier === "1") return "tier1";
  return null;
};

const raidTierPriority: Record<RaidTierKey, number> = {
  primal: 0,
  "legendary-mega": 1,
  "super-mega": 2,
  mega: 3,
  legendary: 4,
  tier3: 5,
  tier1: 6,
  "community-day": 7,
  elite: 8,
  "shadow-legendary": 9,
  "shadow-tier3": 10,
  "shadow-tier1": 11,
};

export const isShadowRaidTier = (tierKey: RaidTierKey): boolean =>
  tierKey === "shadow-tier1" ||
  tierKey === "shadow-tier3" ||
  tierKey === "shadow-legendary";

const doesRaidMetadataMatchVariant = (
  metadata: RaidBossMetadata,
  variant: PokemonVariant,
): boolean => {
  const variantType = variant.variantType.toLowerCase();
  const tierKey = getRaidMetadataTierKey(metadata, variant);
  if (!tierKey) return false;
  if (variantType.includes("shiny")) return false;

  const metadataForm = normalizeRaidForm(metadata.form);
  const variantForm = normalizeRaidForm(variant.megaForm || variant.form);
  const metadataCostumeId = getRaidMetadataCostumeId(metadata);
  const variantCostumeId = getVariantCostumeId(variant);
  const shadowTier = isShadowRaidTier(tierKey);

  if (metadataCostumeId !== null) {
    if (variantCostumeId !== metadataCostumeId) return false;
  } else if (variantCostumeId !== null) {
    return false;
  }

  if (variantType.includes("shadow")) {
    return shadowTier && metadataForm === variantForm;
  }

  if (shadowTier) return false;

  if (variantType.includes("fusion")) {
    const raidName = metadata.name?.toLowerCase() ?? "";
    const variantName = (variant.species_name || variant.name).toLowerCase();
    return tierKey === "legendary" && raidName === variantName;
  }

  if (variant.primal || variantType.includes("primal")) {
    return tierKey === "primal";
  }

  if (variantType.includes("mega")) {
    return (
      (tierKey === "mega" ||
        tierKey === "legendary-mega" ||
        tierKey === "super-mega") &&
      metadataForm === variantForm
    );
  }

  return (
    tierKey !== "mega" &&
    tierKey !== "legendary-mega" &&
    tierKey !== "super-mega" &&
    tierKey !== "primal" &&
    metadataForm === variantForm
  );
};

export const getRaidMetadataForVariant = (
  variant: PokemonVariant,
): RaidBossMetadata[] =>
  (variant.raid_boss ?? []).filter((metadata) =>
    doesRaidMetadataMatchVariant(metadata, variant),
  );

export const getPrimaryRaidMetadataForVariant = (
  variant: PokemonVariant,
): RaidBossMetadata | null =>
  getRaidMetadataForVariant(variant).sort((a, b) => {
    const aTier = getRaidMetadataTierKey(a, variant);
    const bTier = getRaidMetadataTierKey(b, variant);
    return (
      (aTier ? raidTierPriority[aTier] : Number.MAX_SAFE_INTEGER) -
      (bTier ? raidTierPriority[bTier] : Number.MAX_SAFE_INTEGER)
    );
  })[0] ?? null;

export const getRaidTierKeyForVariant = (
  variant: PokemonVariant,
): RaidTierKey | null => {
  const metadata = getPrimaryRaidMetadataForVariant(variant);
  return metadata ? getRaidMetadataTierKey(metadata, variant) : null;
};

const normalizeFusionId = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : null;

const getVariantFusionId = (variant: PokemonVariant): number | null =>
  normalizeFusionId(variant.fusion_id);

const isFusionVariant = (variant: PokemonVariant): boolean =>
  variant.variantType.toLowerCase().includes("fusion");

const getLegalRaidMovesForVariant = (variant: PokemonVariant): Move[] => {
  const moves = Array.isArray(variant.moves) ? variant.moves : [];
  const fusionId = getVariantFusionId(variant);

  if (isFusionVariant(variant) && fusionId != null) {
    const fusionMovePool =
      variant.fusion?.find(
        (fusion) => normalizeFusionId(fusion.fusion_id) === fusionId,
      )?.moves ?? [];

    if (fusionMovePool.length > 0) {
      const hasFusionFastMoves = fusionMovePool.some(
        (move) => move.is_fast === 1,
      );
      if (hasFusionFastMoves) {
        return fusionMovePool;
      }

      return [
        ...moves.filter((move) => normalizeFusionId(move.fusion_id) == null),
        ...fusionMovePool,
      ];
    }
  }

  return moves.filter((move) => {
    const moveFusionId = normalizeFusionId(move.fusion_id);
    if (moveFusionId == null) return true;
    return (
      isFusionVariant(variant) && fusionId != null && moveFusionId === fusionId
    );
  });
};

const getLegalRaidFastMoves = (variant: PokemonVariant): Move[] =>
  expandHiddenPowerFastMoves(
    getLegalRaidMovesForVariant(variant).filter(
      (move) => move.is_fast === 1 && move.raid_power > 0,
    ),
  );

const getLegalRaidChargedMoves = (variant: PokemonVariant): Move[] =>
  getLegalRaidMovesForVariant(variant).filter(
    (move) => move.is_fast === 0 && move.raid_power > 0,
  );

export const isEligibleRaidAttacker = (variant: PokemonVariant): boolean =>
  !isRaidCosmeticVariant(variant) &&
  !isMaxBattleVariant(variant) &&
  Array.isArray(variant.moves) &&
  getLegalRaidFastMoves(variant).length > 0 &&
  getLegalRaidChargedMoves(variant).length > 0;

export const isEligibleRaidBoss = (variant: PokemonVariant): boolean =>
  !isRaidShinyVariant(variant) &&
  !isMaxBattleVariant(variant) &&
  Array.isArray(variant.moves) &&
  variant.moves.length > 0 &&
  getPrimaryRaidMetadataForVariant(variant) !== null;

const getOverallTargetWeight = (target: PokemonVariant): number => {
  const tierKey = getRaidTierKeyForVariant(target);
  if (
    tierKey === "legendary" ||
    tierKey === "elite" ||
    tierKey === "primal" ||
    tierKey === "legendary-mega" ||
    tierKey === "super-mega" ||
    tierKey === "shadow-legendary"
  ) {
    return 4;
  }
  if (tierKey === "mega") {
    return 3;
  }
  if (
    tierKey === "tier3" ||
    tierKey === "community-day" ||
    tierKey === "shadow-tier3"
  ) {
    return 1;
  }
  if (tierKey === "tier1" || tierKey === "shadow-tier1") {
    return 0.25;
  }
  return 1;
};

const getRaidOverallTargetProfiles = (
  targets?: PokemonVariant[],
): RaidOverallTargetProfile[] => {
  const profilesByTypes = new Map<string, RaidOverallTargetProfile>();

  targets?.forEach((target) => {
    const types = getVariantTypeNames(target);
    if (types.length === 0) return;

    const key = [...types].sort().join("/");
    const weight = getOverallTargetWeight(target);
    const existing = profilesByTypes.get(key);

    if (existing) {
      existing.weight += weight;
      return;
    }

    profilesByTypes.set(key, { types, weight });
  });

  const profiles = Array.from(profilesByTypes.values());

  return profiles.length > 0 ? profiles : FALLBACK_OVERALL_TARGET_PROFILES;
};

export const calculateRaidBossCp = (
  variant: PokemonVariant,
  bossHp: number,
): number => {
  const attack = variant.attack + 15;
  const defense = variant.defense + 15;
  return Math.floor((attack * Math.sqrt(defense) * Math.sqrt(bossHp)) / 10);
};

export const calculatePokemonCpForLevel = (
  variant: PokemonVariant,
  level: keyof typeof cpMultipliers,
): number => {
  const cpMultiplier = cpMultipliers[level];
  const attack = variant.attack + 15;
  const defense = variant.defense + 15;
  const stamina = variant.stamina + 15;
  return Math.floor(
    (attack * Math.sqrt(defense) * Math.sqrt(stamina) * cpMultiplier ** 2) / 10,
  );
};

export const calculateRaidBossStats = (
  variant: PokemonVariant,
  tier: RaidTierPreset,
  shadowBossMode: ShadowBossMode,
): RaidBossStats => {
  const enrageDefenseMultiplier =
    shadowBossMode === "enraged" ? SHADOW_BOSS_ENRAGED_DEFENSE_MULTIPLIER : 1;
  const enrageAttackMultiplier =
    shadowBossMode === "enraged" ? SHADOW_BOSS_ENRAGED_ATTACK_MULTIPLIER : 1;

  return {
    bossCp: calculateRaidBossCp(variant, tier.bossHp),
    attack:
      (variant.attack + 15) * tier.bossStatMultiplier * enrageAttackMultiplier,
    defense:
      (variant.defense + 15) *
      tier.bossStatMultiplier *
      enrageDefenseMultiplier,
    hp: tier.bossHp,
    timeLimitSeconds: tier.timeLimitSeconds,
  };
};

type MoveDamageInput = {
  move: Move;
  attacker: PokemonVariant;
  attackerAttack: number;
  bossDefense: number;
  bossTypes: string[];
  settings: RaidCounterSettings;
  charged: boolean;
};

export const calculateRaidMoveDamage = ({
  move,
  attacker,
  attackerAttack,
  bossDefense,
  bossTypes,
  settings,
  charged,
}: MoveDamageInput): number => {
  const moveType = normalizeTypeName(move.type_name || move.type);
  const attackerTypes = getVariantTypeNames(attacker);
  const stab = attackerTypes.includes(moveType) ? STAB_DAMAGE_BONUS : 1;
  const effectiveness = getTypeEffectivenessMultiplier(moveType, bossTypes);
  const weather =
    settings.weatherBoostedType === moveType ? WEATHER_DAMAGE_BONUS : 1;
  const shadow = attacker.variantType.toLowerCase().includes("shadow")
    ? SHADOW_ATTACKER_DAMAGE_BONUS
    : 1;
  const partyPower = charged
    ? PARTY_POWER_CHARGED_DAMAGE_BONUS[settings.partyPower]
    : 1;
  const damageMultiplier =
    stab *
    effectiveness *
    weather *
    shadow *
    FRIENDSHIP_DAMAGE_BONUS[settings.friendship] *
    MEGA_ALLY_DAMAGE_BONUS[settings.megaAllyBonus] *
    partyPower;

  return Math.max(
    1,
    Math.floor(
      0.5 *
        getRaidMovePower(move) *
        (attackerAttack / bossDefense) *
        damageMultiplier,
    ) + 1,
  );
};

type TypeDpsMoveDamageInput = Omit<
  MoveDamageInput,
  "bossTypes" | "bossDefense"
> & {
  selectedType: string;
  targetTypes?: string[];
};

const getProcessedRaidMoveSeconds = (move: Move): number => {
  const rawSeconds = Math.max(0.5, getRaidMoveCooldown(move) / 1000);
  return Math.max(0.5, Math.round(rawSeconds * 2) / 2);
};

const getProcessedRaidMovePower = (move: Move): number => {
  const power = getRaidMovePower(move);
  const rawSeconds = Math.max(0.5, getRaidMoveCooldown(move) / 1000);
  const processedSeconds = getProcessedRaidMoveSeconds(move);
  const timingAdjustment = (processedSeconds - rawSeconds) / processedSeconds;

  return Math.abs(timingAdjustment) >= 0.199
    ? power * (1 + timingAdjustment)
    : power;
};

const getTypeDpsEffectiveness = (
  moveType: string,
  selectedType: string,
): number => (selectedType !== "normal" && moveType === selectedType ? 1.6 : 1);

const calculateTypeDpsMoveDamage = ({
  move,
  attacker,
  attackerAttack,
  selectedType,
  targetTypes,
  settings,
  charged,
}: TypeDpsMoveDamageInput): number => {
  const moveType = normalizeTypeName(move.type_name || move.type);
  const attackerTypes = getVariantTypeNames(attacker);
  const stab = attackerTypes.includes(moveType) ? STAB_DAMAGE_BONUS : 1;
  const effectiveness =
    targetTypes && targetTypes.length > 0
      ? getTypeEffectivenessMultiplier(moveType, targetTypes)
      : getTypeDpsEffectiveness(moveType, selectedType);
  const weather =
    settings.weatherBoostedType === moveType ? WEATHER_DAMAGE_BONUS : 1;
  const shadow = attacker.variantType.toLowerCase().includes("shadow")
    ? SHADOW_ATTACKER_DAMAGE_BONUS
    : 1;
  const partyPower = charged
    ? PARTY_POWER_CHARGED_DAMAGE_BONUS[settings.partyPower]
    : 1;
  const damageMultiplier =
    stab *
    effectiveness *
    weather *
    shadow *
    FRIENDSHIP_DAMAGE_BONUS[settings.friendship] *
    MEGA_ALLY_DAMAGE_BONUS[settings.megaAllyBonus] *
    partyPower;

  return Math.max(
    1,
    Math.floor(
      0.5 *
        getProcessedRaidMovePower(move) *
        (attackerAttack / TYPE_DPS_TARGET_DEFENSE) *
        damageMultiplier,
    ) + 1,
  );
};

const calculateComprehensiveTypeDps = ({
  fastDamage,
  chargedDamage,
  fastMove,
  chargedMove,
  attackerHp,
  incomingDps,
  incomingChargedDamage,
}: {
  fastDamage: number;
  chargedDamage: number;
  fastMove: Move;
  chargedMove: Move;
  attackerHp: number;
  incomingDps: number;
  incomingChargedDamage: number;
}): number => {
  const fastSeconds = getProcessedRaidMoveSeconds(fastMove);
  const chargedSeconds = getProcessedRaidMoveSeconds(chargedMove);
  const fastEnergy = Math.max(1, getRaidMoveEnergy(fastMove));
  const chargedEnergyCost = Math.max(
    1,
    Math.abs(getRaidMoveEnergy(chargedMove)),
  );
  const fastDps = fastDamage / fastSeconds;
  const chargedDps = chargedDamage / chargedSeconds;
  const fastEps = fastEnergy / fastSeconds;
  let chargedEps = chargedEnergyCost / chargedSeconds;

  if (chargedEnergyCost >= 100) {
    chargedEps = (chargedEnergyCost + 0.5 * fastEnergy) / chargedSeconds;
  }

  if (fastDps >= chargedDps || fastEps <= 0 || chargedEps <= 0) {
    return Math.max(0, fastDps);
  }

  const expectedOverflowEnergy =
    0.5 * chargedEnergyCost + 0.5 * fastEnergy + 0.5 * incomingChargedDamage;
  const baselineDps =
    (fastDps * chargedEps + chargedDps * fastEps) / (chargedEps + fastEps);
  const incomingEnergyAdjustment =
    ((chargedDps - fastDps) / (chargedEps + fastEps)) *
    (0.5 - expectedOverflowEnergy / attackerHp) *
    incomingDps;
  const dps = baselineDps + incomingEnergyAdjustment;

  return Math.max(0, fastDps, dps);
};

export const calculateEffectiveRaidDps = ({
  dps,
  tdo,
  relobbySeconds,
  teamSize = RAID_ATTACKER_TEAM_SIZE,
}: {
  dps: number;
  tdo: number;
  relobbySeconds: number;
  teamSize?: number;
}): number => {
  if (!Number.isFinite(dps) || !Number.isFinite(tdo) || dps <= 0 || tdo <= 0)
    return 0;

  const validTeamSize = Math.max(1, Math.floor(teamSize));
  const activeSeconds = (tdo / dps) * validTeamSize;
  const downtimeSeconds = Math.max(0, relobbySeconds);

  return (dps * activeSeconds) / (activeSeconds + downtimeSeconds);
};

const compareRaidTypeDpsScores = (
  a: RaidTypeDpsScore,
  b: RaidTypeDpsScore,
): number => {
  const aPureMoveset = a.fastMatchesType && a.chargedMatchesType ? 1 : 0;
  const bPureMoveset = b.fastMatchesType && b.chargedMatchesType ? 1 : 0;
  const aChargedMatch = a.chargedMatchesType ? 1 : 0;
  const bChargedMatch = b.chargedMatchesType ? 1 : 0;

  return (
    b.eDps - a.eDps ||
    b.er - a.er ||
    b.dps - a.dps ||
    bPureMoveset - aPureMoveset ||
    bChargedMatch - aChargedMatch ||
    b.tdo - a.tdo ||
    b.totalDps - a.totalDps
  );
};

const compareRaidOverallScores = (
  a: RaidOverallScore,
  b: RaidOverallScore,
): number =>
  b.eDps - a.eDps ||
  b.er - a.er ||
  b.dps - a.dps ||
  b.tdo - a.tdo ||
  b.cp - a.cp;

export const calculateMoveCycleScore = (
  attacker: PokemonVariant,
  fastMove: Move,
  chargedMove: Move,
  boss: PokemonVariant,
  tier: RaidTierPreset,
  settings: RaidCounterSettings,
): RaidCounterScore => {
  const cpMultiplier = cpMultipliers[settings.attackerLevel];
  const attackerAttack = (attacker.attack + 15) * cpMultiplier;
  const bossTypes = getVariantTypeNames(boss);
  const bossStats = calculateRaidBossStats(boss, tier, settings.shadowBossMode);

  const fastDamage = calculateRaidMoveDamage({
    move: fastMove,
    attacker,
    attackerAttack,
    bossDefense: bossStats.defense,
    bossTypes,
    settings,
    charged: false,
  });
  const chargedDamage = calculateRaidMoveDamage({
    move: chargedMove,
    attacker,
    attackerAttack,
    bossDefense: bossStats.defense,
    bossTypes,
    settings,
    charged: true,
  });
  const fastEnergy = Math.max(1, getRaidMoveEnergy(fastMove));
  const chargedEnergyCost = Math.max(
    1,
    Math.abs(getRaidMoveEnergy(chargedMove)),
  );
  const fastUses = Math.max(1, Math.ceil(chargedEnergyCost / fastEnergy));
  const fastSeconds = Math.max(0.5, getRaidMoveCooldown(fastMove) / 1000);
  const chargedSeconds = Math.max(0.5, getRaidMoveCooldown(chargedMove) / 1000);
  const cycleSeconds = fastUses * fastSeconds + chargedSeconds;
  const cycleDamage = fastUses * fastDamage + chargedDamage;
  const dps = cycleDamage / cycleSeconds;
  const soloTimeSeconds = bossStats.hp / dps;

  return {
    variant: attacker,
    fastMove,
    chargedMove,
    cp: calculatePokemonCpForLevel(attacker, settings.attackerLevel),
    dps,
    fastDamage,
    chargedDamage,
    cycleSeconds,
    cycleDamage,
    effectiveness: getTypeEffectivenessMultiplier(
      normalizeTypeName(chargedMove.type_name || chargedMove.type),
      bossTypes,
    ),
    soloTimeSeconds,
    trainersNeeded: Math.max(
      1,
      Math.ceil(
        bossStats.hp / (dps * bossStats.timeLimitSeconds * RAID_SAFETY_FACTOR),
      ),
    ),
  };
};

export const scoreRaidCounters = (
  attackers: PokemonVariant[],
  boss: PokemonVariant,
  tier: RaidTierPreset,
  settings: RaidCounterSettings,
): RaidCounterScore[] =>
  attackers
    .filter(isEligibleRaidAttacker)
    .flatMap((attacker) => {
      const fastMoves = getLegalRaidFastMoves(attacker);
      const chargedMoves = getLegalRaidChargedMoves(attacker);

      return fastMoves.flatMap((fastMove) =>
        chargedMoves.map((chargedMove) =>
          calculateMoveCycleScore(
            attacker,
            fastMove,
            chargedMove,
            boss,
            tier,
            settings,
          ),
        ),
      );
    })
    .sort((a, b) => b.dps - a.dps);

export const calculateOverallMoveCycleScore = (
  attacker: PokemonVariant,
  fastMove: Move,
  chargedMove: Move,
  settings: RaidCounterSettings,
  targetProfiles: RaidOverallTargetProfile[] = FALLBACK_OVERALL_TARGET_PROFILES,
): RaidOverallScore => {
  const cpMultiplier = cpMultipliers[settings.attackerLevel];
  const attackerAttack = (attacker.attack + 15) * cpMultiplier;
  const shadowDefense = attacker.variantType.toLowerCase().includes("shadow")
    ? SHADOW_ATTACKER_DEFENSE_MULTIPLIER
    : 1;
  const attackerDefense =
    (attacker.defense + 15) * cpMultiplier * shadowDefense;
  const attackerHp = Math.max(
    1,
    Math.floor((attacker.stamina + 15) * cpMultiplier),
  );
  const incomingDps = TYPE_DPS_INCOMING_DAMAGE_NUMERATOR / attackerDefense;
  const incomingChargedDamage =
    TYPE_DPS_INCOMING_CHARGED_DAMAGE_NUMERATOR / attackerDefense;
  const fastEnergy = Math.max(1, getRaidMoveEnergy(fastMove));
  const chargedEnergyCost = Math.max(
    1,
    Math.abs(getRaidMoveEnergy(chargedMove)),
  );
  const fastUses = Math.max(1, Math.ceil(chargedEnergyCost / fastEnergy));
  const fastSeconds = getProcessedRaidMoveSeconds(fastMove);
  const chargedSeconds = getProcessedRaidMoveSeconds(chargedMove);
  const cycleSeconds = fastUses * fastSeconds + chargedSeconds;
  const timeToFaintSeconds = attackerHp / incomingDps;

  let scoreWeight = 0;
  let fastDamageSum = 0;
  let chargedDamageSum = 0;
  let cycleDamageSum = 0;
  let dpsSum = 0;
  let tdoSum = 0;
  let erSum = 0;
  let eDpsSum = 0;

  for (const targetProfile of targetProfiles) {
    const targetTypes = targetProfile.types;
    const weight = targetProfile.weight;
    const fastDamage = calculateTypeDpsMoveDamage({
      move: fastMove,
      attacker,
      attackerAttack,
      selectedType: "",
      targetTypes,
      settings,
      charged: false,
    });
    const chargedDamage = calculateTypeDpsMoveDamage({
      move: chargedMove,
      attacker,
      attackerAttack,
      selectedType: "",
      targetTypes,
      settings,
      charged: true,
    });
    const dps = calculateComprehensiveTypeDps({
      fastDamage,
      chargedDamage,
      fastMove,
      chargedMove,
      attackerHp,
      incomingDps,
      incomingChargedDamage,
    });
    const tdo = dps * timeToFaintSeconds;
    const er =
      dps > 0 && tdo > 0
        ? Math.pow(dps, 1 - TYPE_DPS_ER_TDO_EXPONENT) *
          Math.pow(tdo, TYPE_DPS_ER_TDO_EXPONENT)
        : 0;
    const eDps = calculateEffectiveRaidDps({
      dps,
      tdo,
      relobbySeconds: settings.relobbySeconds,
    });

    scoreWeight += weight;
    fastDamageSum += fastDamage * weight;
    chargedDamageSum += chargedDamage * weight;
    cycleDamageSum += (fastUses * fastDamage + chargedDamage) * weight;
    dpsSum += dps * weight;
    tdoSum += tdo * weight;
    erSum += er * weight;
    eDpsSum += eDps * weight;
  }

  const averageWeight = Math.max(1, scoreWeight);
  const fastDamage = fastDamageSum / averageWeight;
  const chargedDamage = chargedDamageSum / averageWeight;
  const cycleDamage = cycleDamageSum / averageWeight;
  const dps = dpsSum / averageWeight;
  const tdo = tdoSum / averageWeight;
  const er = erSum / averageWeight;
  const eDps = eDpsSum / averageWeight;

  return {
    variant: attacker,
    fastMove,
    chargedMove,
    cp: calculatePokemonCpForLevel(attacker, settings.attackerLevel),
    eDps,
    dps,
    tdo,
    er,
    fastDamage,
    chargedDamage,
    cycleSeconds,
    cycleDamage,
  };
};

export const scoreRaidOverallAttackers = (
  attackers: PokemonVariant[],
  settings: RaidCounterSettings,
  targets?: PokemonVariant[],
): RaidOverallScore[] => {
  const targetProfiles = getRaidOverallTargetProfiles(targets);

  return attackers
    .filter(isEligibleRaidAttacker)
    .flatMap((attacker) => {
      const fastMoves = getLegalRaidFastMoves(attacker);
      const chargedMoves = getLegalRaidChargedMoves(attacker);

      return fastMoves.flatMap((fastMove) =>
        chargedMoves.map((chargedMove) =>
          calculateOverallMoveCycleScore(
            attacker,
            fastMove,
            chargedMove,
            settings,
            targetProfiles,
          ),
        ),
      );
    })
    .sort(compareRaidOverallScores);
};

export const scoreBestRaidOverallAttackers = (
  attackers: PokemonVariant[],
  settings: RaidCounterSettings,
  targets?: PokemonVariant[],
): RaidOverallScore[] => {
  const targetProfiles = getRaidOverallTargetProfiles(targets);
  const targetWeight = Math.max(
    1,
    targetProfiles.reduce((sum, profile) => sum + profile.weight, 0),
  );
  const bestByVariant = new Map<string, RaidOverallScore>();

  attackers.filter(isEligibleRaidAttacker).forEach((attacker) => {
    const fastMoves = getLegalRaidFastMoves(attacker);
    const chargedMoves = getLegalRaidChargedMoves(attacker);
    const key =
      attacker.variant_id || `${attacker.pokemon_id}-${attacker.variantType}`;
    const cpMultiplier = cpMultipliers[settings.attackerLevel];
    const attackerAttack = (attacker.attack + 15) * cpMultiplier;
    const shadowDefense = attacker.variantType.toLowerCase().includes("shadow")
      ? SHADOW_ATTACKER_DEFENSE_MULTIPLIER
      : 1;
    const attackerDefense =
      (attacker.defense + 15) * cpMultiplier * shadowDefense;
    const attackerHp = Math.max(
      1,
      Math.floor((attacker.stamina + 15) * cpMultiplier),
    );
    const incomingDps = TYPE_DPS_INCOMING_DAMAGE_NUMERATOR / attackerDefense;
    const incomingChargedDamage =
      TYPE_DPS_INCOMING_CHARGED_DAMAGE_NUMERATOR / attackerDefense;
    const timeToFaintSeconds = attackerHp / incomingDps;
    const cp = calculatePokemonCpForLevel(attacker, settings.attackerLevel);
    const prepareMoveDamages = (moves: Move[], charged: boolean) =>
      moves.map((move) => ({
        move,
        damages: targetProfiles.map((targetProfile) =>
          calculateTypeDpsMoveDamage({
            move,
            attacker,
            attackerAttack,
            selectedType: "",
            targetTypes: targetProfile.types,
            settings,
            charged,
          }),
        ),
      }));
    const fastMoveDamages = prepareMoveDamages(fastMoves, false);
    const chargedMoveDamages = prepareMoveDamages(chargedMoves, true);

    fastMoveDamages.forEach(({ move: fastMove, damages: fastDamages }) => {
      chargedMoveDamages.forEach(
        ({ move: chargedMove, damages: chargedDamages }) => {
          const fastEnergy = Math.max(1, getRaidMoveEnergy(fastMove));
          const chargedEnergyCost = Math.max(
            1,
            Math.abs(getRaidMoveEnergy(chargedMove)),
          );
          const fastUses = Math.max(
            1,
            Math.ceil(chargedEnergyCost / fastEnergy),
          );
          const fastSeconds = getProcessedRaidMoveSeconds(fastMove);
          const chargedSeconds = getProcessedRaidMoveSeconds(chargedMove);
          const cycleSeconds = fastUses * fastSeconds + chargedSeconds;

          let fastDamageSum = 0;
          let chargedDamageSum = 0;
          let cycleDamageSum = 0;
          let dpsSum = 0;
          let tdoSum = 0;
          let erSum = 0;
          let eDpsSum = 0;

          targetProfiles.forEach((targetProfile, index) => {
            const weight = targetProfile.weight;
            const fastDamage = fastDamages[index] ?? 0;
            const chargedDamage = chargedDamages[index] ?? 0;
            const dps = calculateComprehensiveTypeDps({
              fastDamage,
              chargedDamage,
              fastMove,
              chargedMove,
              attackerHp,
              incomingDps,
              incomingChargedDamage,
            });
            const tdo = dps * timeToFaintSeconds;
            const er =
              dps > 0 && tdo > 0
                ? Math.pow(dps, 1 - TYPE_DPS_ER_TDO_EXPONENT) *
                  Math.pow(tdo, TYPE_DPS_ER_TDO_EXPONENT)
                : 0;
            const eDps = calculateEffectiveRaidDps({
              dps,
              tdo,
              relobbySeconds: settings.relobbySeconds,
            });

            fastDamageSum += fastDamage * weight;
            chargedDamageSum += chargedDamage * weight;
            cycleDamageSum += (fastUses * fastDamage + chargedDamage) * weight;
            dpsSum += dps * weight;
            tdoSum += tdo * weight;
            erSum += er * weight;
            eDpsSum += eDps * weight;
          });

          const score: RaidOverallScore = {
            variant: attacker,
            fastMove,
            chargedMove,
            cp,
            eDps: eDpsSum / targetWeight,
            dps: dpsSum / targetWeight,
            tdo: tdoSum / targetWeight,
            er: erSum / targetWeight,
            fastDamage: fastDamageSum / targetWeight,
            chargedDamage: chargedDamageSum / targetWeight,
            cycleSeconds,
            cycleDamage: cycleDamageSum / targetWeight,
          };
          const current = bestByVariant.get(key);
          if (!current || compareRaidOverallScores(score, current) < 0) {
            bestByVariant.set(key, score);
          }
        },
      );
    });
  });

  return Array.from(bestByVariant.values()).sort(compareRaidOverallScores);
};

export const calculateTypeMoveCycleScore = (
  attacker: PokemonVariant,
  fastMove: Move,
  chargedMove: Move,
  typeName: string,
  settings: RaidCounterSettings,
): RaidTypeDpsScore => {
  const targetType = normalizeTypeName(typeName);
  const fastType = normalizeTypeName(fastMove.type_name || fastMove.type);
  const chargedType = normalizeTypeName(
    chargedMove.type_name || chargedMove.type,
  );
  const fastEffectiveness = getTypeDpsEffectiveness(fastType, targetType);
  const chargedEffectiveness = getTypeDpsEffectiveness(chargedType, targetType);
  const cpMultiplier = cpMultipliers[settings.attackerLevel];
  const attackerAttack = (attacker.attack + 15) * cpMultiplier;
  const shadowDefense = attacker.variantType.toLowerCase().includes("shadow")
    ? SHADOW_ATTACKER_DEFENSE_MULTIPLIER
    : 1;
  const attackerDefense =
    (attacker.defense + 15) * cpMultiplier * shadowDefense;
  const attackerHp = Math.max(
    1,
    Math.floor((attacker.stamina + 15) * cpMultiplier),
  );
  const incomingDps = TYPE_DPS_INCOMING_DAMAGE_NUMERATOR / attackerDefense;
  const incomingChargedDamage =
    TYPE_DPS_INCOMING_CHARGED_DAMAGE_NUMERATOR / attackerDefense;

  const fastDamage = calculateTypeDpsMoveDamage({
    move: fastMove,
    attacker,
    attackerAttack,
    selectedType: targetType,
    settings,
    charged: false,
  });
  const chargedDamage = calculateTypeDpsMoveDamage({
    move: chargedMove,
    attacker,
    attackerAttack,
    selectedType: targetType,
    settings,
    charged: true,
  });
  const fastEnergy = Math.max(1, getRaidMoveEnergy(fastMove));
  const chargedEnergyCost = Math.max(
    1,
    Math.abs(getRaidMoveEnergy(chargedMove)),
  );
  const fastUses = Math.max(1, Math.ceil(chargedEnergyCost / fastEnergy));
  const fastSeconds = getProcessedRaidMoveSeconds(fastMove);
  const chargedSeconds = getProcessedRaidMoveSeconds(chargedMove);
  const cycleSeconds = fastUses * fastSeconds + chargedSeconds;
  const cycleDamage = fastUses * fastDamage + chargedDamage;
  const dps = calculateComprehensiveTypeDps({
    fastDamage,
    chargedDamage,
    fastMove,
    chargedMove,
    attackerHp,
    incomingDps,
    incomingChargedDamage,
  });
  const timeToFaintSeconds = attackerHp / incomingDps;
  const tdo = dps * timeToFaintSeconds;
  const eDps = calculateEffectiveRaidDps({
    dps,
    tdo,
    relobbySeconds: settings.relobbySeconds,
  });

  return {
    variant: attacker,
    fastMove,
    chargedMove,
    cp: calculatePokemonCpForLevel(attacker, settings.attackerLevel),
    totalDps: dps,
    eDps,
    dps,
    tdo,
    er:
      dps > 0 && tdo > 0
        ? Math.pow(dps, 1 - TYPE_DPS_ER_TDO_EXPONENT) *
          Math.pow(tdo, TYPE_DPS_ER_TDO_EXPONENT)
        : 0,
    fastDamage,
    chargedDamage,
    fastEffectiveness,
    chargedEffectiveness,
    cycleSeconds,
    cycleDamage,
    targetEffectiveness: targetType === "normal" ? 1 : 1.6,
    fastMatchesType: fastType === targetType,
    chargedMatchesType: chargedType === targetType,
  };
};

export const scoreRaidTypeDps = (
  attackers: PokemonVariant[],
  typeName: string,
  settings: RaidCounterSettings,
): RaidTypeDpsScore[] => {
  const targetType = normalizeTypeName(typeName);
  if (!targetType) return [];

  return attackers
    .filter(isEligibleRaidAttacker)
    .flatMap((attacker) => {
      const fastMoves = getLegalRaidFastMoves(attacker);
      const chargedMoves = getLegalRaidChargedMoves(attacker);

      return fastMoves.flatMap((fastMove) =>
        chargedMoves
          .filter((chargedMove) => {
            const fastType = normalizeTypeName(
              fastMove.type_name || fastMove.type,
            );
            const chargedType = normalizeTypeName(
              chargedMove.type_name || chargedMove.type,
            );
            return fastType === targetType || chargedType === targetType;
          })
          .map((chargedMove) =>
            calculateTypeMoveCycleScore(
              attacker,
              fastMove,
              chargedMove,
              targetType,
              settings,
            ),
          ),
      );
    })
    .sort(compareRaidTypeDpsScores);
};

export const dedupeBestCounterPerVariant = (
  scores: RaidCounterScore[],
): RaidCounterScore[] => {
  const bestByVariant = new Map<string, RaidCounterScore>();
  scores.forEach((score) => {
    const key =
      score.variant.variant_id ||
      `${score.variant.pokemon_id}-${score.variant.variantType}`;
    const current = bestByVariant.get(key);
    if (!current || score.dps > current.dps) {
      bestByVariant.set(key, score);
    }
  });

  return Array.from(bestByVariant.values()).sort((a, b) => b.dps - a.dps);
};

export const dedupeBestTypeDpsPerVariant = (
  scores: RaidTypeDpsScore[],
): RaidTypeDpsScore[] => {
  const bestByVariant = new Map<string, RaidTypeDpsScore>();
  scores.forEach((score) => {
    const key =
      score.variant.variant_id ||
      `${score.variant.pokemon_id}-${score.variant.variantType}`;
    const current = bestByVariant.get(key);
    if (!current || compareRaidTypeDpsScores(score, current) < 0) {
      bestByVariant.set(key, score);
    }
  });

  return Array.from(bestByVariant.values()).sort(compareRaidTypeDpsScores);
};

export const dedupeBestOverallAttackerPerVariant = (
  scores: RaidOverallScore[],
): RaidOverallScore[] => {
  const bestByVariant = new Map<string, RaidOverallScore>();
  scores.forEach((score) => {
    const key =
      score.variant.variant_id ||
      `${score.variant.pokemon_id}-${score.variant.variantType}`;
    const current = bestByVariant.get(key);
    if (!current || compareRaidOverallScores(score, current) < 0) {
      bestByVariant.set(key, score);
    }
  });

  return Array.from(bestByVariant.values()).sort(compareRaidOverallScores);
};

export const estimateRaidGroup = (
  scores: RaidCounterScore[],
  boss: PokemonVariant,
  tier: RaidTierPreset,
  shadowBossMode: ShadowBossMode,
): RaidGroupEstimate => {
  const bestCounters = dedupeBestCounterPerVariant(scores).slice(0, 6);
  const topTeamDps =
    bestCounters.length > 0
      ? bestCounters.reduce((sum, counter) => sum + counter.dps, 0) /
        bestCounters.length
      : 0;
  const bossStats = calculateRaidBossStats(boss, tier, shadowBossMode);

  if (topTeamDps <= 0) {
    return {
      topTeamDps: 0,
      minTrainers: 0,
      comfortableTrainers: 0,
      soloTimeSeconds: 0,
    };
  }

  return {
    topTeamDps,
    minTrainers: Math.max(
      1,
      Math.ceil(
        bossStats.hp /
          (topTeamDps * bossStats.timeLimitSeconds * RAID_SAFETY_FACTOR),
      ),
    ),
    comfortableTrainers: Math.max(
      1,
      Math.ceil(
        bossStats.hp /
          (topTeamDps * bossStats.timeLimitSeconds * COMFORTABLE_SAFETY_FACTOR),
      ),
    ),
    soloTimeSeconds: bossStats.hp / topTeamDps,
  };
};

export const inferRaidTierFromMetadata = (
  variant: PokemonVariant,
): RaidTierKey | null => {
  return getRaidTierKeyForVariant(variant);
};

export const formatSeconds = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "-";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  if (minutes <= 0) return `${remainingSeconds}s`;
  return `${minutes}m ${remainingSeconds.toString().padStart(2, "0")}s`;
};
