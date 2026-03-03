export type OwnershipMode = 'caught' | 'trade' | 'wanted';
export type OwnershipModeInput = OwnershipMode | null | undefined;

const FALLBACK_OWNERSHIP_MODE: OwnershipMode = 'caught';

export const normalizeOwnershipMode = (
  value: OwnershipModeInput,
): OwnershipMode => {
  if (value === 'caught' || value === 'trade' || value === 'wanted') {
    return value;
  }
  return FALLBACK_OWNERSHIP_MODE;
};

export const toOwnershipApiValue = (mode: OwnershipMode): OwnershipMode =>
  mode;

export const isCaughtOwnershipMode = (
  value: OwnershipModeInput,
): boolean => normalizeOwnershipMode(value) === 'caught';

export const caseFold = (value: string): string => value.toLowerCase();

export const equalsCaseInsensitive = (a: string, b: string): boolean =>
  caseFold(a) === caseFold(b);

export const stripDiacritics = (value: string): string =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
