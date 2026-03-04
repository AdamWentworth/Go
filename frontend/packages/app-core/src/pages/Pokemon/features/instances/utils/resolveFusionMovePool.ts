import type { Instances } from '@/types/instances';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { Move } from '@/types/pokemonSubTypes';

type FusionMoveState = {
  is_fused?: boolean;
  fusion_form?: string | null;
  fusedWith?: string | null;
  fusedOtherInstanceKey?: string | null;
};

type ResolveFusionMovePoolParams = {
  pokemon: Pick<PokemonVariant, 'moves' | 'fusion'>;
  fusion: FusionMoveState;
  instances: Instances;
  variants: PokemonVariant[];
};

const UUID_SUFFIX_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const normalizeVariantKey = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const underscoreIndex = trimmed.lastIndexOf('_');
  if (underscoreIndex <= 0) return trimmed;
  const suffix = trimmed.slice(underscoreIndex + 1);
  if (!UUID_SUFFIX_REGEX.test(suffix)) return trimmed;
  return trimmed.slice(0, underscoreIndex);
};

const normalizeText = (value: unknown): string =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

const parseFusionId = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

const dedupeByMoveId = (moves: Move[]): Move[] => {
  const seen = new Set<number>();
  const deduped: Move[] = [];
  for (const move of moves) {
    if (typeof move?.move_id !== 'number') continue;
    if (seen.has(move.move_id)) continue;
    seen.add(move.move_id);
    deduped.push(move);
  }
  return deduped;
};

const findFusionEntry = (
  fusionEntries: Array<{ fusion_id?: number | null; name?: string; moves?: Move[] }>,
  fusionState: FusionMoveState,
): { fusion_id?: number | null; name?: string; moves?: Move[] } | undefined => {
  const byId = parseFusionId(fusionState.fusion_form);
  if (byId != null) {
    const match = fusionEntries.find((entry) => entry.fusion_id === byId);
    if (match) return match;
  }

  const normalizedName = normalizeText(fusionState.fusion_form);
  if (normalizedName) {
    const match = fusionEntries.find(
      (entry) => normalizeText(entry.name) === normalizedName,
    );
    if (match) return match;
  }

  if (fusionState.is_fused && fusionEntries.length === 1) {
    return fusionEntries[0];
  }

  return undefined;
};

const pickPartnerVariantByPokemonId = (
  variants: PokemonVariant[],
  pokemonId: number,
): PokemonVariant | undefined => {
  const pool = variants.filter((variant) => variant.pokemon_id === pokemonId);
  if (pool.length === 0) return undefined;
  return (
    pool.find((variant) => variant.variantType === 'default') ??
    pool.find((variant) => variant.variantType === 'shiny') ??
    pool[0]
  );
};

const pickPartnerVariant = ({
  fusion,
  instances,
  variants,
  pokemon,
}: {
  fusion: FusionMoveState;
  instances: Instances;
  variants: PokemonVariant[];
  pokemon: Pick<PokemonVariant, 'fusion'>;
}): PokemonVariant | undefined => {
  const instanceCandidates = [fusion.fusedWith, fusion.fusedOtherInstanceKey]
    .filter((id): id is string => typeof id === 'string' && id.length > 0)
    .map((id) => instances[id])
    .filter((row): row is Instances[string] => Boolean(row));

  for (const row of instanceCandidates) {
    const rowVariantId = normalizeVariantKey(row.variant_id);
    if (rowVariantId) {
      const exact = variants.find((variant) => variant.variant_id === rowVariantId);
      if (exact) return exact;
    }

    if (typeof row.pokemon_id === 'number') {
      const byPokemonId = pickPartnerVariantByPokemonId(variants, row.pokemon_id);
      if (byPokemonId) return byPokemonId;
    }
  }

  const normalizedFusionForm = normalizeText(fusion.fusion_form);
  const fusionEntry = normalizedFusionForm
    ? pokemon.fusion?.find((entry) => normalizeText(entry.name) === normalizedFusionForm)
    : undefined;
  const partnerPokemonId = fusionEntry?.base_pokemon_id2;
  if (typeof partnerPokemonId === 'number') {
    return pickPartnerVariantByPokemonId(variants, partnerPokemonId);
  }

  return undefined;
};

const isSignatureFusionMove = (move: Move): boolean =>
  normalizeText(move.name).includes('fusion ');

export const resolveFusionMovePool = ({
  pokemon,
  fusion,
  instances,
  variants,
}: ResolveFusionMovePoolParams): Move[] => {
  const baseMoves = Array.isArray(pokemon.moves) ? pokemon.moves : [];

  if (!fusion.is_fused) {
    return dedupeByMoveId(baseMoves);
  }

  const fusionEntries = Array.isArray(pokemon.fusion)
    ? pokemon.fusion
    : [];
  const selectedFusion = findFusionEntry(
    fusionEntries as Array<{ fusion_id?: number | null; name?: string; moves?: Move[] }>,
    fusion,
  );
  const selectedFusionMoves = Array.isArray(selectedFusion?.moves)
    ? selectedFusion.moves
    : [];

  // Preferred path for the new payload shape: fusion entries provide their
  // own canonical move pools.
  if (selectedFusionMoves.length > 0) {
    return dedupeByMoveId(selectedFusionMoves);
  }

  const partnerVariant = pickPartnerVariant({ fusion, instances, variants, pokemon });
  const partnerMoves = Array.isArray(partnerVariant?.moves) ? partnerVariant.moves : [];

  if (partnerMoves.length === 0) {
    return dedupeByMoveId(baseMoves);
  }

  const baseMoveIds = new Set(baseMoves.map((move) => move.move_id));
  const uniquePartnerMoves = partnerMoves.filter(
    (move) => typeof move?.move_id === 'number' && !baseMoveIds.has(move.move_id),
  );

  if (uniquePartnerMoves.length === 0) {
    return dedupeByMoveId(baseMoves);
  }

  const explicitFusionMoves = uniquePartnerMoves.filter(isSignatureFusionMove);
  const fallbackLegacyMoves = uniquePartnerMoves.filter((move) => move.legacy === true);
  const injectedMoves =
    explicitFusionMoves.length > 0
      ? explicitFusionMoves
      : fallbackLegacyMoves.length > 0
        ? fallbackLegacyMoves
        : [];

  return dedupeByMoveId([...baseMoves, ...injectedMoves]);
};
