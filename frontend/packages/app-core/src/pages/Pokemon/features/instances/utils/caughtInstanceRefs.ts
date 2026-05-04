import type { PokemonInstance } from '@/types/pokemonInstance';

const UUID_AT_END_REGEX =
  /([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i;

export const extractLegacyInstanceId = (key: string): string | null => {
  const idx = key.lastIndexOf('_');
  if (idx < 0 || idx >= key.length - 1) return null;
  const suffix = key.slice(idx + 1);
  return suffix || null;
};

export const normalizeInstanceToken = (
  value: string | null | undefined,
): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;
  const uuidMatch = trimmed.match(UUID_AT_END_REGEX);
  if (uuidMatch?.[1]) return uuidMatch[1];
  return trimmed;
};

export const collectInstanceRefCandidates = (value: string | null): string[] => {
  if (!value) return [];
  const refs = new Set<string>();
  refs.add(value.toLowerCase());
  const legacy = extractLegacyInstanceId(value);
  if (legacy) refs.add(legacy.toLowerCase());
  const normalized = normalizeInstanceToken(value);
  if (normalized) refs.add(normalized.toLowerCase());
  return [...refs];
};

export const findInstanceByRefs = (
  collection: Record<string, PokemonInstance> | null | undefined,
  refs: string[],
): PokemonInstance | null => {
  if (!collection || refs.length === 0) return null;
  const refSet = new Set(refs);

  for (const [key, row] of Object.entries(collection)) {
    const keyRefs = collectInstanceRefCandidates(key);
    if (keyRefs.some((ref) => refSet.has(ref))) return row;

    const rowInstanceId =
      typeof row?.instance_id === 'string' && row.instance_id.length > 0
        ? row.instance_id
        : null;
    const rowRefs = collectInstanceRefCandidates(rowInstanceId);
    if (rowRefs.some((ref) => refSet.has(ref))) return row;
  }

  return null;
};

export const parseBackgroundId = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};
