import type { PokemonVariant } from "@/types/pokemonVariants";
import type { Move } from "@/types/pokemonSubTypes";
import { TYPE_MAPPING } from "./constants";
import { expandHiddenPowerFastMoves } from "./hiddenPower";
import {
  FALLBACK_OVERALL_TARGET_PROFILES,
  LEGACY_RAID_TIERS,
} from "./raidRules";
import type { RaidOverallTargetProfile, RaidTierKey } from "./raidTypes";
import { getTypeEffectivenessMultiplier } from "./typeEffectiveness";

type RaidBossMetadata = NonNullable<PokemonVariant["raid_boss"]>[number];

export const normalizeTypeName = (value?: string | null): string => {
  const normalized = value?.trim().toLowerCase() ?? "";
  return normalized === "none" || normalized === "unknown" ? "" : normalized;
};

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
  return variantType.includes("dynamax") || variantType.includes("gigantamax");
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

export const getLegalRaidFastMoves = (variant: PokemonVariant): Move[] =>
  expandHiddenPowerFastMoves(
    getLegalRaidMovesForVariant(variant).filter(
      (move) => move.is_fast === 1 && move.raid_power > 0,
    ),
  );

export const getLegalRaidChargedMoves = (variant: PokemonVariant): Move[] =>
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

const isHighTierRaidTarget = (target: PokemonVariant): boolean => {
  const tierKey = getRaidTierKeyForVariant(target);
  return (
    tierKey === "legendary" ||
    tierKey === "elite" ||
    tierKey === "primal" ||
    tierKey === "legendary-mega" ||
    tierKey === "super-mega" ||
    tierKey === "mega" ||
    tierKey === "shadow-legendary"
  );
};

export const getRaidOverallTargetProfiles = (
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

export const getRaidTypeTargetProfiles = (
  typeName: string,
  targets?: PokemonVariant[],
): RaidOverallTargetProfile[] => {
  const attackingType = normalizeTypeName(typeName);
  if (!attackingType) return [];

  const profilesByTypes = new Map<string, RaidOverallTargetProfile>();

  targets?.forEach((target) => {
    const types = getVariantTypeNames(target);
    if (
      !isHighTierRaidTarget(target) ||
      types.length === 0 ||
      getTypeEffectivenessMultiplier(attackingType, types) <= 1
    ) {
      return;
    }

    const key = [...types].sort().join("/");
    const weight = getOverallTargetWeight(target);
    const existing = profilesByTypes.get(key);

    if (existing) {
      existing.weight += weight;
      return;
    }

    profilesByTypes.set(key, { types, weight });
  });

  return Array.from(profilesByTypes.values());
};
