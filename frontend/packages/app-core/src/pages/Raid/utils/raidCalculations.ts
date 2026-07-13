import type { PokemonVariant } from '@/types/pokemonVariants';
import type { Move } from '@/types/pokemonSubTypes';
import { cpMultipliers, TYPE_MAPPING } from './constants';
import { getTypeEffectivenessMultiplier } from './typeEffectiveness';

type RaidBossMetadata = NonNullable<PokemonVariant['raid_boss']>[number];

export type RaidTierKey =
  | 'tier1'
  | 'tier3'
  | 'community-day'
  | 'mega'
  | 'legendary'
  | 'elite'
  | 'primal'
  | 'legendary-mega'
  | 'super-mega'
  | 'shadow-tier1'
  | 'shadow-tier3'
  | 'shadow-legendary';

export type FriendshipKey = 'none' | 'good' | 'great' | 'ultra' | 'best';
export type MegaAllyBonusKey = 'none' | 'general' | 'matching';
export type PartyPowerKey = 'none' | 'occasional' | 'frequent' | 'every';
export type ShadowBossMode = 'normal' | 'enraged' | 'subdued';

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

export type RaidGroupEstimate = {
  topTeamDps: number;
  minTrainers: number;
  comfortableTrainers: number;
  soloTimeSeconds: number;
};

export const RAID_TIER_PRESETS: Record<RaidTierKey, RaidTierPreset> = {
  tier1: {
    key: 'tier1',
    label: 'One-star Raid',
    shortLabel: '1-star',
    bossHp: 600,
    bossStatMultiplier: 0.5974,
    timeLimitSeconds: 180,
    note: 'Low HP Gym raid, usually soloable.',
  },
  tier3: {
    key: 'tier3',
    label: 'Three-star Raid',
    shortLabel: '3-star',
    bossHp: 3600,
    bossStatMultiplier: 0.73,
    timeLimitSeconds: 180,
    note: 'Mid-tier Gym raid with the post-2020 reward tier.',
  },
  'community-day': {
    key: 'community-day',
    label: 'Community Day Raid',
    shortLabel: '4-star',
    bossHp: 9000,
    bossStatMultiplier: 0.79,
    timeLimitSeconds: 180,
    note: 'Local-only post-Community-Day style raid.',
  },
  mega: {
    key: 'mega',
    label: 'Mega Raid',
    shortLabel: 'Mega',
    bossHp: 9000,
    bossStatMultiplier: 0.79,
    timeLimitSeconds: 300,
    note: 'Standard Mega raid awarding Mega Energy by speed.',
  },
  legendary: {
    key: 'legendary',
    label: 'Legendary Raid',
    shortLabel: '5-star',
    bossHp: 15000,
    bossStatMultiplier: 0.79,
    timeLimitSeconds: 300,
    note: 'Normal five-star Legendary, Ultra Beast, or Fusion raid baseline.',
  },
  elite: {
    key: 'elite',
    label: 'Elite Raid',
    shortLabel: 'Elite',
    bossHp: 20000,
    bossStatMultiplier: 0.79,
    timeLimitSeconds: 300,
    note: 'Local-only Elite raid durability.',
  },
  primal: {
    key: 'primal',
    label: 'Primal Raid',
    shortLabel: 'Primal',
    bossHp: 22500,
    bossStatMultiplier: 0.79,
    timeLimitSeconds: 300,
    note: 'Primal Groudon and Primal Kyogre durability.',
  },
  'legendary-mega': {
    key: 'legendary-mega',
    label: 'Mega Legendary Raid',
    shortLabel: 'Mega Legendary',
    bossHp: 22500,
    bossStatMultiplier: 0.79,
    timeLimitSeconds: 300,
    note: 'Legendary or Mythical Mega raid durability.',
  },
  'super-mega': {
    key: 'super-mega',
    label: 'Super Mega Raid',
    shortLabel: 'Super Mega',
    bossHp: 25000,
    bossStatMultiplier: 0.79,
    timeLimitSeconds: 300,
    note: 'Shielded Super Mega baseline before shield pacing.',
  },
  'shadow-tier1': {
    key: 'shadow-tier1',
    label: 'Shadow One-star Raid',
    shortLabel: 'Shadow 1-star',
    bossHp: 600,
    bossStatMultiplier: 0.5974,
    timeLimitSeconds: 180,
    note: 'Team GO Rocket one-star Shadow raid with enrage and Purified Gem mechanics.',
  },
  'shadow-tier3': {
    key: 'shadow-tier3',
    label: 'Shadow Three-star Raid',
    shortLabel: 'Shadow 3-star',
    bossHp: 3600,
    bossStatMultiplier: 0.73,
    timeLimitSeconds: 180,
    note: 'Team GO Rocket three-star Shadow raid with enrage and Purified Gem mechanics.',
  },
  'shadow-legendary': {
    key: 'shadow-legendary',
    label: 'Shadow Legendary Raid',
    shortLabel: 'Shadow 5-star',
    bossHp: 15000,
    bossStatMultiplier: 0.79,
    timeLimitSeconds: 300,
    note: 'Five-star Shadow Legendary raid with enrage and Purified Gem mechanics.',
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
const WEATHER_DAMAGE_BONUS = 1.2;
const STAB_DAMAGE_BONUS = 1.2;
const SHADOW_BOSS_ENRAGED_ATTACK_MULTIPLIER = 1.81;
const SHADOW_BOSS_ENRAGED_DEFENSE_MULTIPLIER = 3;
const RAID_SAFETY_FACTOR = 0.82;
const COMFORTABLE_SAFETY_FACTOR = 0.68;
const LEGACY_RAID_TIERS = new Set(['2']);

const normalizeTypeName = (value?: string | null): string => {
  const normalized = value?.trim().toLowerCase() ?? '';
  return normalized === 'none' || normalized === 'unknown' ? '' : normalized;
};

export const getVariantTypeNames = (variant: PokemonVariant): string[] => {
  const type1 = normalizeTypeName(variant.type1_name ?? TYPE_MAPPING[variant.type_1_id]?.name);
  const type2 = normalizeTypeName(variant.type2_name ?? TYPE_MAPPING[variant.type_2_id]?.name);
  return [type1, type2].filter(Boolean);
};

export const isRaidCosmeticVariant = (variant: PokemonVariant): boolean => {
  const variantType = variant.variantType.toLowerCase();
  return variantType.includes('shiny') || variantType.startsWith('costume');
};

const isRaidShinyVariant = (variant: PokemonVariant): boolean =>
  variant.variantType.toLowerCase().includes('shiny');

const getRaidMetadataCostumeId = (metadata: RaidBossMetadata): number | null => {
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
  const normalized = form?.trim().toLowerCase() ?? '';
  if (!normalized || normalized === 'default' || normalized === 'normal') return '';
  if (normalized === 'alola') return 'alolan';
  if (normalized === 'galar') return 'galarian';
  return normalized;
};

const getRaidMetadataTierKey = (
  metadata: RaidBossMetadata,
  variant?: PokemonVariant,
): RaidTierKey | null => {
  const tier = metadata.tier?.toLowerCase() ?? '';
  if (!tier || LEGACY_RAID_TIERS.has(tier)) return null;
  if (tier === 'shadow_1') return 'shadow-tier1';
  if (tier === 'shadow_3') return 'shadow-tier3';
  if (tier === 'shadow_5') return 'shadow-legendary';
  if (tier === 'fusion_5') return 'legendary';
  if (tier === 'super_mega') return 'super-mega';
  if (tier === 'mega_legendary') return variant?.primal ? 'primal' : 'legendary-mega';
  if (tier === 'mega') return 'mega';
  if (tier === 'ex' || tier.includes('elite')) return 'elite';
  if (tier === '6' || tier === '5' || tier.includes('legendary')) return 'legendary';
  if (tier === '4') return 'community-day';
  if (tier === '3') return 'tier3';
  if (tier === '1') return 'tier1';
  return null;
};

const raidTierPriority: Record<RaidTierKey, number> = {
  primal: 0,
  'legendary-mega': 1,
  'super-mega': 2,
  mega: 3,
  legendary: 4,
  tier3: 5,
  tier1: 6,
  'community-day': 7,
  elite: 8,
  'shadow-legendary': 9,
  'shadow-tier3': 10,
  'shadow-tier1': 11,
};

export const isShadowRaidTier = (tierKey: RaidTierKey): boolean =>
  tierKey === 'shadow-tier1' || tierKey === 'shadow-tier3' || tierKey === 'shadow-legendary';

const doesRaidMetadataMatchVariant = (
  metadata: RaidBossMetadata,
  variant: PokemonVariant,
): boolean => {
  const variantType = variant.variantType.toLowerCase();
  const tierKey = getRaidMetadataTierKey(metadata, variant);
  if (!tierKey) return false;
  if (variantType.includes('shiny')) return false;

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

  if (variantType.includes('shadow')) {
    return shadowTier && metadataForm === variantForm;
  }

  if (shadowTier) return false;

  if (variantType.includes('fusion')) {
    const raidName = metadata.name?.toLowerCase() ?? '';
    const variantName = (variant.species_name || variant.name).toLowerCase();
    return tierKey === 'legendary' && raidName === variantName;
  }

  if (variant.primal || variantType.includes('primal')) {
    return tierKey === 'primal';
  }

  if (variantType.includes('mega')) {
    return (
      (tierKey === 'mega' || tierKey === 'legendary-mega' || tierKey === 'super-mega') &&
      metadataForm === variantForm
    );
  }

  return (
    tierKey !== 'mega' &&
    tierKey !== 'legendary-mega' &&
    tierKey !== 'super-mega' &&
    tierKey !== 'primal' &&
    metadataForm === variantForm
  );
};

export const getRaidMetadataForVariant = (variant: PokemonVariant): RaidBossMetadata[] =>
  (variant.raid_boss ?? []).filter((metadata) => doesRaidMetadataMatchVariant(metadata, variant));

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

export const getRaidTierKeyForVariant = (variant: PokemonVariant): RaidTierKey | null => {
  const metadata = getPrimaryRaidMetadataForVariant(variant);
  return metadata ? getRaidMetadataTierKey(metadata, variant) : null;
};

export const isEligibleRaidAttacker = (variant: PokemonVariant): boolean =>
  !isRaidCosmeticVariant(variant) &&
  Array.isArray(variant.moves) &&
  variant.moves.some((move) => move.is_fast === 1 && move.raid_power > 0) &&
  variant.moves.some((move) => move.is_fast === 0 && move.raid_power > 0);

export const isEligibleRaidBoss = (variant: PokemonVariant): boolean =>
  !isRaidShinyVariant(variant) &&
  Array.isArray(variant.moves) &&
  variant.moves.length > 0 &&
  getPrimaryRaidMetadataForVariant(variant) !== null;

export const calculateRaidBossCp = (variant: PokemonVariant, bossHp: number): number => {
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
  return Math.floor((attack * Math.sqrt(defense) * Math.sqrt(stamina) * cpMultiplier ** 2) / 10);
};

export const calculateRaidBossStats = (
  variant: PokemonVariant,
  tier: RaidTierPreset,
  shadowBossMode: ShadowBossMode,
): RaidBossStats => {
  const enrageDefenseMultiplier =
    shadowBossMode === 'enraged' ? SHADOW_BOSS_ENRAGED_DEFENSE_MULTIPLIER : 1;
  const enrageAttackMultiplier =
    shadowBossMode === 'enraged' ? SHADOW_BOSS_ENRAGED_ATTACK_MULTIPLIER : 1;

  return {
    bossCp: calculateRaidBossCp(variant, tier.bossHp),
    attack: (variant.attack + 15) * tier.bossStatMultiplier * enrageAttackMultiplier,
    defense: (variant.defense + 15) * tier.bossStatMultiplier * enrageDefenseMultiplier,
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
  const weather = settings.weatherBoostedType === moveType ? WEATHER_DAMAGE_BONUS : 1;
  const shadow =
    attacker.variantType.toLowerCase().includes('shadow') ? SHADOW_ATTACKER_DAMAGE_BONUS : 1;
  const partyPower = charged ? PARTY_POWER_CHARGED_DAMAGE_BONUS[settings.partyPower] : 1;
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
    Math.floor(0.5 * move.raid_power * (attackerAttack / bossDefense) * damageMultiplier) + 1,
  );
};

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
  const fastEnergy = Math.max(1, fastMove.raid_energy);
  const chargedEnergyCost = Math.max(1, Math.abs(chargedMove.raid_energy));
  const fastUses = Math.max(1, Math.ceil(chargedEnergyCost / fastEnergy));
  const fastSeconds = Math.max(0.5, fastMove.raid_cooldown / 1000);
  const chargedSeconds = Math.max(0.5, chargedMove.raid_cooldown / 1000);
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
      Math.ceil(bossStats.hp / (dps * bossStats.timeLimitSeconds * RAID_SAFETY_FACTOR)),
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
      const fastMoves = attacker.moves.filter((move) => move.is_fast === 1 && move.raid_power > 0);
      const chargedMoves = attacker.moves.filter(
        (move) => move.is_fast === 0 && move.raid_power > 0,
      );

      return fastMoves.flatMap((fastMove) =>
        chargedMoves.map((chargedMove) =>
          calculateMoveCycleScore(attacker, fastMove, chargedMove, boss, tier, settings),
        ),
      );
    })
    .sort((a, b) => b.dps - a.dps);

export const dedupeBestCounterPerVariant = (scores: RaidCounterScore[]): RaidCounterScore[] => {
  const bestByVariant = new Map<string, RaidCounterScore>();
  scores.forEach((score) => {
    const key = score.variant.variant_id || `${score.variant.pokemon_id}-${score.variant.variantType}`;
    const current = bestByVariant.get(key);
    if (!current || score.dps > current.dps) {
      bestByVariant.set(key, score);
    }
  });

  return Array.from(bestByVariant.values()).sort((a, b) => b.dps - a.dps);
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
      ? bestCounters.reduce((sum, counter) => sum + counter.dps, 0) / bestCounters.length
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
      Math.ceil(bossStats.hp / (topTeamDps * bossStats.timeLimitSeconds * RAID_SAFETY_FACTOR)),
    ),
    comfortableTrainers: Math.max(
      1,
      Math.ceil(
        bossStats.hp / (topTeamDps * bossStats.timeLimitSeconds * COMFORTABLE_SAFETY_FACTOR),
      ),
    ),
    soloTimeSeconds: bossStats.hp / topTeamDps,
  };
};

export const inferRaidTierFromMetadata = (variant: PokemonVariant): RaidTierKey | null => {
  return getRaidTierKeyForVariant(variant);
};

export const formatSeconds = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds <= 0) return '-';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  if (minutes <= 0) return `${remainingSeconds}s`;
  return `${minutes}m ${remainingSeconds.toString().padStart(2, '0')}s`;
};
