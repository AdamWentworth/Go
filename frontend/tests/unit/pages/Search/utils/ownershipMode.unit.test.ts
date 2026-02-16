import { describe, expect, it } from 'vitest';

import {
  isCaughtOwnershipMode,
  normalizeOwnershipMode,
  toOwnershipApiValue,
} from '@/pages/Search/utils/ownershipMode';

describe('ownershipMode utils', () => {
  it('preserves canonical modes and falls back to caught', () => {
    expect(normalizeOwnershipMode('caught')).toBe('caught');
    expect(normalizeOwnershipMode('trade')).toBe('trade');
    expect(normalizeOwnershipMode('wanted')).toBe('wanted');
    expect(normalizeOwnershipMode(undefined)).toBe('caught');
    expect(normalizeOwnershipMode(null)).toBe('caught');
  });

  it('maps canonical caught to legacy api ownership value', () => {
    expect(toOwnershipApiValue('caught')).toBe('caught');
    expect(toOwnershipApiValue('trade')).toBe('trade');
    expect(toOwnershipApiValue('wanted')).toBe('wanted');
  });

  it('identifies caught mode only for caught values', () => {
    expect(isCaughtOwnershipMode('caught')).toBe(true);
    expect(isCaughtOwnershipMode('trade')).toBe(false);
  });
});
