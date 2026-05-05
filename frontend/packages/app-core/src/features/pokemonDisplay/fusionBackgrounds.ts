import type { PokemonVariant } from '@/types/pokemonVariants';
import type {
  FusionBackgroundComboRule,
  VariantBackground,
} from '@/types/pokemonSubTypes';

type FusionBackgroundState = {
  is_fused?: boolean;
  fusion_form?: string | null;
  storedFusionObject?: unknown;
};

type ResolveFusionBackgroundPoolParams = {
  pokemon: Pick<PokemonVariant, 'backgrounds' | 'fusion'> &
    Partial<Pick<PokemonVariant, 'fusion_id' | 'variantType'>>;
  fusion: FusionBackgroundState;
};

type FusionEntry = {
  fusion_id?: number | null;
  name?: string;
  base_pokemon_id1?: number;
  base_pokemon_id2?: number;
  backgrounds?: VariantBackground[];
  background_combo_rules?: FusionBackgroundComboRule[];
};

type ResolveFusionComboBackgroundParams = {
  pokemonId: number;
  fusionEntries: FusionEntry[] | null | undefined;
  resolvedFusionId: number | null;
  fusionForm: string | null | undefined;
  ownBackgroundId: number | null;
  partnerBackgroundId: number | null;
  availableBackgrounds: VariantBackground[];
};

export type FusionBackgroundSource = 'base' | 'fusion' | 'fusion_missing';

export type ResolveFusionBackgroundPoolResult = {
  backgrounds: VariantBackground[];
  source: FusionBackgroundSource;
  fusionId: number | null;
};

const normalizeText = (value: unknown): string =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

const normalizeFusionToken = (value: unknown): string =>
  normalizeText(value)
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');

const parseFusionId = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const directMatch = trimmed.match(/^\d+$/);
  if (directMatch) {
    const parsed = Number(directMatch[0]);
    return Number.isFinite(parsed) ? parsed : null;
  }

  const prefixedMatch = trimmed.match(/^(?:shiny[_\s-]?)?fusion[_\s-]?(\d+)$/i);
  if (!prefixedMatch) return null;

  const parsed = Number(prefixedMatch[1]);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseFusionIdFromVariantType = (value: unknown): number | null => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  const match = normalized.match(/(?:^|_)fusion_(\d+)$/);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseFusionIdsFromStoredObject = (value: unknown): number[] => {
  if (!value || typeof value !== 'object') return [];

  const fusionIds: number[] = [];
  for (const [rawKey, rawValue] of Object.entries(value as Record<string, unknown>)) {
    if (!rawValue) continue;
    const parsed = parseFusionId(rawKey);
    if (parsed != null) fusionIds.push(parsed);
  }

  return fusionIds;
};

const dedupeBackgrounds = (backgrounds: VariantBackground[]): VariantBackground[] => {
  const seen = new Set<string>();
  const deduped: VariantBackground[] = [];

  for (const background of backgrounds) {
    if (!background || typeof background.background_id !== 'number') continue;
    const costumeId =
      typeof background.costume_id === 'number' && Number.isFinite(background.costume_id)
        ? background.costume_id
        : 0;
    const key = `${background.background_id}:${costumeId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(background);
  }

  return deduped;
};

const findFusionEntryForPool = (
  fusionEntries: FusionEntry[],
  fusionState: FusionBackgroundState,
): FusionEntry | undefined => {
  const explicitFusionId = parseFusionId(fusionState.fusion_form);
  if (explicitFusionId != null) {
    const match = fusionEntries.find((entry) => entry.fusion_id === explicitFusionId);
    if (match) return match;
  }

  const normalizedName = normalizeFusionToken(fusionState.fusion_form);
  if (normalizedName) {
    const match = fusionEntries.find(
      (entry) => normalizeFusionToken(entry.name) === normalizedName,
    );
    if (match) return match;
  }

  const storedFusionIds = parseFusionIdsFromStoredObject(fusionState.storedFusionObject);
  for (const candidateId of storedFusionIds) {
    const match = fusionEntries.find((entry) => entry.fusion_id === candidateId);
    if (match) return match;
  }

  if (fusionState.is_fused && fusionEntries.length === 1) {
    return fusionEntries[0];
  }

  return undefined;
};

export const resolvePokemonDisplayFusionBackgroundPool = ({
  pokemon,
  fusion,
}: ResolveFusionBackgroundPoolParams): ResolveFusionBackgroundPoolResult => {
  const baseBackgrounds = dedupeBackgrounds(
    Array.isArray(pokemon.backgrounds) ? pokemon.backgrounds : [],
  );

  if (!fusion.is_fused) {
    return {
      backgrounds: baseBackgrounds,
      source: 'base',
      fusionId: null,
    };
  }

  const fusionEntries = Array.isArray(pokemon.fusion)
    ? (pokemon.fusion as FusionEntry[])
    : [];
  const fusionFormId = parseFusionId(fusion.fusion_form);
  const storedFusionIds = parseFusionIdsFromStoredObject(fusion.storedFusionObject);
  const idCandidates = Array.from(
    new Set(
      [
        fusionFormId,
        ...storedFusionIds,
        typeof pokemon.fusion_id === 'number' ? pokemon.fusion_id : null,
        parseFusionIdFromVariantType(pokemon.variantType),
      ].filter((id): id is number => id != null),
    ),
  );

  const selectedFusionByState = findFusionEntryForPool(fusionEntries, fusion);
  const selectedFusion =
    selectedFusionByState ??
    idCandidates
      .map((candidateId) => fusionEntries.find((entry) => entry.fusion_id === candidateId))
      .find((entry) => entry != null);

  const selectedFusionId =
    typeof selectedFusion?.fusion_id === 'number'
      ? selectedFusion.fusion_id
      : idCandidates[0] ?? null;

  const fusionBackgrounds = dedupeBackgrounds(
    Array.isArray(selectedFusion?.backgrounds) ? selectedFusion.backgrounds : [],
  );

  if (fusionBackgrounds.length > 0) {
    return {
      backgrounds: fusionBackgrounds,
      source: 'fusion',
      fusionId: selectedFusionId,
    };
  }

  const variantTypeFusionId = parseFusionIdFromVariantType(pokemon.variantType);
  const variantLooksLikeFusion =
    variantTypeFusionId != null ||
    (typeof pokemon.fusion_id === 'number' && pokemon.fusion_id > 0);

  if (variantLooksLikeFusion && baseBackgrounds.length > 0) {
    return {
      backgrounds: baseBackgrounds,
      source: 'fusion',
      fusionId: selectedFusionId,
    };
  }

  return {
    backgrounds: [],
    source: 'fusion_missing',
    fusionId: selectedFusionId,
  };
};

const findFusionEntryForCombo = ({
  fusionEntries,
  resolvedFusionId,
  fusionForm,
}: {
  fusionEntries: FusionEntry[];
  resolvedFusionId: number | null;
  fusionForm: string | null | undefined;
}): FusionEntry | null => {
  const normalizedFusionForm = normalizeFusionToken(fusionForm);
  if (normalizedFusionForm) {
    const byName = fusionEntries.find(
      (entry) => normalizeFusionToken(entry.name) === normalizedFusionForm,
    );
    if (byName) return byName;
  }

  if (resolvedFusionId != null) {
    const byId = fusionEntries.find((entry) => entry.fusion_id === resolvedFusionId);
    if (byId) return byId;
  }

  if (fusionEntries.length === 1) return fusionEntries[0];
  return null;
};

export const resolvePokemonDisplayFusionComboBackground = ({
  pokemonId,
  fusionEntries,
  resolvedFusionId,
  fusionForm,
  ownBackgroundId,
  partnerBackgroundId,
  availableBackgrounds,
}: ResolveFusionComboBackgroundParams): VariantBackground | null => {
  if (ownBackgroundId == null || partnerBackgroundId == null) return null;

  const entries = Array.isArray(fusionEntries) ? fusionEntries : [];
  if (entries.length === 0) return null;

  const fusionEntry = findFusionEntryForCombo({
    fusionEntries: entries,
    resolvedFusionId,
    fusionForm,
  });
  if (!fusionEntry) return null;

  const comboRules = Array.isArray(fusionEntry.background_combo_rules)
    ? fusionEntry.background_combo_rules
    : [];
  if (comboRules.length === 0) return null;

  const pokemonIsMember1 = fusionEntry.base_pokemon_id1 === pokemonId;
  const pokemonIsMember2 = fusionEntry.base_pokemon_id2 === pokemonId;

  const matchingRule = comboRules.find((rule) => {
    if (pokemonIsMember1) {
      return (
        rule.member1_background_id === ownBackgroundId &&
        rule.member2_background_id === partnerBackgroundId
      );
    }
    if (pokemonIsMember2) {
      return (
        rule.member2_background_id === ownBackgroundId &&
        rule.member1_background_id === partnerBackgroundId
      );
    }
    return (
      (rule.member1_background_id === ownBackgroundId &&
        rule.member2_background_id === partnerBackgroundId) ||
      (rule.member2_background_id === ownBackgroundId &&
        rule.member1_background_id === partnerBackgroundId)
    );
  });

  if (!matchingRule) return null;

  const existingBackground =
    availableBackgrounds.find(
      (background) => background.background_id === matchingRule.combo_background_id,
    ) ?? null;
  if (existingBackground) return existingBackground;

  if (
    typeof matchingRule.combo_background_image_url === 'string' &&
    matchingRule.combo_background_image_url.trim().length > 0
  ) {
    return {
      background_id: matchingRule.combo_background_id,
      image_url: matchingRule.combo_background_image_url,
      name: matchingRule.combo_background_name ?? `Background ${matchingRule.combo_background_id}`,
      costume_id: 0,
      date: matchingRule.combo_background_date ?? '',
      location: matchingRule.combo_background_location ?? '',
    };
  }

  return null;
};
