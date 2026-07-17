import type { PokemonVariant } from "@/types/pokemonVariants";
import { resolveAssetUrl } from "@/utils/assetUrl";
import { getTypeIconPath } from "@/utils/imageHelpers";
import { getVariantTypeNames } from "./raidCalculations";
import type {
  FriendshipKey,
  MegaAllyBonusKey,
  PartyPowerKey,
  RaidCounterScore,
  RaidCounterSettings,
  RaidOverallScore,
  RaidTypeDpsScore,
} from "./raidCalculations";

export type RaidViewMode = "overall" | "type-dps" | "boss";
export type RaidMetricSortKey = "eDps" | "dps" | "tdo" | "er" | "cp";
export type RaidMetricSortDirection = "ascending" | "descending";

type RaidMetricScore = Pick<
  RaidOverallScore,
  RaidMetricSortKey | "variant"
>;

export type SearchableCounterScore = {
  variant: PokemonVariant;
  fastMove: RaidCounterScore["fastMove"];
  chargedMove: RaidCounterScore["chargedMove"];
};

export const DEFAULT_TYPE_DPS_PAGE = "dark";
export const DEFAULT_METRIC_SORT: RaidMetricSortKey = "eDps";

export const FRIENDSHIP_OPTIONS: Array<{
  key: FriendshipKey;
  label: string;
}> = [
  { key: "none", label: "No friendship" },
  { key: "good", label: "Good" },
  { key: "great", label: "Great" },
  { key: "ultra", label: "Ultra" },
  { key: "best", label: "Best" },
];

export const MEGA_OPTIONS: Array<{
  key: MegaAllyBonusKey;
  label: string;
}> = [
  { key: "none", label: "No Mega ally" },
  { key: "general", label: "Mega ally" },
  { key: "matching", label: "Matching Mega" },
];

export const PARTY_POWER_OPTIONS: Array<{
  key: PartyPowerKey;
  label: string;
}> = [
  { key: "none", label: "No Party Power" },
  { key: "occasional", label: "Occasional" },
  { key: "frequent", label: "Frequent" },
  { key: "every", label: "Every charge" },
];

export const ATTACKER_LEVEL_OPTIONS: RaidCounterSettings["attackerLevel"][] = [
  "40.0",
  "50.0",
  "51.0",
];

export const RELOBBY_DELAY_OPTIONS = [0, 5, 10, 15, 20];

export const capitalize = (value: string): string =>
  value.length === 0
    ? value
    : `${value.charAt(0).toUpperCase()}${value.slice(1)}`;

export const formatTypeList = (types: string[]): string =>
  types.map(capitalize).join(" / ");

export const getPokemonImage = (variant: PokemonVariant): string =>
  resolveAssetUrl(
    variant.currentImage || variant.image_url || variant.sprite_url || "",
  );

const RAID_FUSION_NAMES: Readonly<Record<number, string>> = {
  1: "Dusk Mane Necrozma",
  2: "Dawn Wings Necrozma",
  3: "White Kyurem",
  4: "Black Kyurem",
};

const getFusionId = (variant: PokemonVariant): number | null => {
  const explicitId = Number(variant.fusion_id);
  if (Number.isInteger(explicitId) && explicitId > 0) return explicitId;

  const match = variant.variantType.toLowerCase().match(/fusion_(\d+)/);
  if (!match) return null;

  const variantTypeId = Number(match[1]);
  return Number.isInteger(variantTypeId) ? variantTypeId : null;
};

export const getRaidVariantDisplayName = (
  variant: PokemonVariant,
): string => {
  const variantType = variant.variantType.toLowerCase();
  if (!variantType.includes("fusion")) return variant.name;

  const fusionId = getFusionId(variant);
  const fusionName =
    (fusionId == null ? undefined : RAID_FUSION_NAMES[fusionId]) ||
    variant.fusion?.find((fusion) => fusion.fusion_id === fusionId)?.name ||
    variant.species_name ||
    variant.name;
  const normalizedName = fusionName.replace(/^Shiny\s+/i, "");
  const isShiny = variantType.includes("shiny") || /^Shiny\s+/i.test(variant.name);

  return `${isShiny ? "Shiny " : ""}${normalizedName}`;
};

export const isMegaMewtwoY = (variant: PokemonVariant): boolean => {
  const megaForm = (variant.megaForm || variant.form || "").trim().toUpperCase();
  return (
    variant.pokemon_id === 150 &&
    variant.variantType.toLowerCase().includes("mega") &&
    megaForm === "Y"
  );
};

export const getVariantBadge = (variant: PokemonVariant): string => {
  const type = variant.variantType.toLowerCase();
  if (type.includes("shadow")) return "Shadow";
  if (type.includes("primal")) return "Primal";
  if (type.includes("mega")) return "Mega";
  if (type.includes("fusion")) return "Fusion";
  if (type.includes("dynamax")) return "Dynamax";
  if (type.includes("gigantamax")) return "Gigantamax";
  return "Pokemon";
};

export const formatDps = (value: number): string => value.toFixed(1);
export const formatEr = (value: number): string => value.toFixed(2);
export const formatWholeNumber = (value: number): string =>
  Math.round(value).toLocaleString();

export const getMoveTypeName = (
  move: RaidTypeDpsScore["fastMove"],
): string => capitalize(move.type_name || move.type || "unknown");

export const getMoveTypeIcon = (
  move: SearchableCounterScore["fastMove"],
): string => getTypeIconPath(move.type_name || move.type || "unknown");

export const getTypeClassName = (typeName?: string): string =>
  `type-${(typeName || "unknown")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")}`;

export const getUniqueByVariant = (
  variants: PokemonVariant[],
): PokemonVariant[] => {
  const seen = new Set<string>();
  return variants.filter((variant) => {
    const key =
      variant.variant_id || `${variant.pokemon_id}-${variant.variantType}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const sortRaidMetricScores = <Score extends RaidMetricScore>(
  scores: Score[],
  metric: RaidMetricSortKey,
  direction: RaidMetricSortDirection,
): Score[] =>
  [...scores].sort((a, b) => {
    const difference = a[metric] - b[metric];
    if (difference !== 0) {
      return direction === "descending" ? -difference : difference;
    }

    return getRaidVariantDisplayName(a.variant).localeCompare(
      getRaidVariantDisplayName(b.variant),
    );
  });

export const matchesCounterSearch = (
  score: SearchableCounterScore,
  query: string,
): boolean => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  const types = getVariantTypeNames(score.variant);

  return (
    getRaidVariantDisplayName(score.variant)
      .toLowerCase()
      .includes(normalized) ||
    score.fastMove.name.toLowerCase().includes(normalized) ||
    score.chargedMove.name.toLowerCase().includes(normalized) ||
    types.some((type) => type.includes(normalized))
  );
};
