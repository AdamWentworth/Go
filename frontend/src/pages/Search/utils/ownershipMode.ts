export type SearchOwnershipMode = 'caught' | 'trade' | 'wanted';
export type SearchOwnershipModeInput = SearchOwnershipMode | null | undefined;
export type SearchOwnershipApiValue = SearchOwnershipMode;

const FALLBACK_MODE: SearchOwnershipMode = 'caught';

export const normalizeOwnershipMode = (
  value: SearchOwnershipModeInput,
): SearchOwnershipMode => {
  if (value === 'caught' || value === 'trade' || value === 'wanted') {
    return value;
  }
  return FALLBACK_MODE;
};

export const toOwnershipApiValue = (
  mode: SearchOwnershipMode,
): SearchOwnershipApiValue => {
  // Backend now expects canonical naming.
  return mode;
};

export const isCaughtOwnershipMode = (value: SearchOwnershipModeInput): boolean =>
  normalizeOwnershipMode(value) === 'caught';
