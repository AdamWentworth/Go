import type { PokemonVariant } from '@/types/pokemonVariants';
import type { VariantBackground } from '@/types/pokemonSubTypes';

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

const findFusionEntry = (
  fusionEntries: Array<{ fusion_id?: number | null; name?: string; backgrounds?: VariantBackground[] }>,
  fusionState: FusionBackgroundState,
): { fusion_id?: number | null; name?: string; backgrounds?: VariantBackground[] } | undefined => {
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

export const resolveFusionBackgroundPool = ({
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

  const fusionEntries = Array.isArray(pokemon.fusion) ? pokemon.fusion : [];
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

  const selectedFusionByState = findFusionEntry(
    fusionEntries as Array<{ fusion_id?: number | null; name?: string; backgrounds?: VariantBackground[] }>,
    fusion,
  );
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
    variantTypeFusionId != null || (typeof pokemon.fusion_id === 'number' && pokemon.fusion_id > 0);

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
