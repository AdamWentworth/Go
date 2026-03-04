import type { PokemonVariant } from '@/types/pokemonVariants';
import type { Move } from '@/types/pokemonSubTypes';

type FusionMoveState = {
  is_fused?: boolean;
  fusion_form?: string | null;
};

type ResolveFusionMovePoolParams = {
  pokemon: Pick<PokemonVariant, 'moves' | 'fusion'>;
  fusion: FusionMoveState;
};

export type FusionMoveSource = 'base' | 'fusion' | 'fusion_missing';

export type ResolveFusionMovePoolResult = {
  moves: Move[];
  source: FusionMoveSource;
  fusionId: number | null;
};

const normalizeText = (value: unknown): string =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

const normalizeFusionToken = (value: unknown): string =>
  normalizeText(value)
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');

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

  const normalizedName = normalizeFusionToken(fusionState.fusion_form);
  if (normalizedName) {
    const match = fusionEntries.find(
      (entry) => normalizeFusionToken(entry.name) === normalizedName,
    );
    if (match) return match;
  }

  if (fusionState.is_fused && fusionEntries.length === 1) {
    return fusionEntries[0];
  }

  return undefined;
};

export const resolveFusionMovePool = ({
  pokemon,
  fusion,
}: ResolveFusionMovePoolParams): ResolveFusionMovePoolResult => {
  const baseMoves = Array.isArray(pokemon.moves) ? pokemon.moves : [];

  if (!fusion.is_fused) {
    return {
      moves: dedupeByMoveId(baseMoves),
      source: 'base',
      fusionId: null,
    };
  }

  const fusionEntries = Array.isArray(pokemon.fusion) ? pokemon.fusion : [];
  const selectedFusion = findFusionEntry(
    fusionEntries as Array<{ fusion_id?: number | null; name?: string; moves?: Move[] }>,
    fusion,
  );
  const selectedFusionId =
    typeof selectedFusion?.fusion_id === 'number'
      ? selectedFusion.fusion_id
      : parseFusionId(fusion.fusion_form);
  const selectedFusionMoves = Array.isArray(selectedFusion?.moves) ? selectedFusion.moves : [];

  if (selectedFusionMoves.length > 0) {
    return {
      moves: dedupeByMoveId(selectedFusionMoves),
      source: 'fusion',
      fusionId: selectedFusionId ?? null,
    };
  }

  return {
    moves: [],
    source: 'fusion_missing',
    fusionId: selectedFusionId ?? null,
  };
};
