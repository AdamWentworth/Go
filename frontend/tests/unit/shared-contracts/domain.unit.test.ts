import { describe, expect, it } from 'vitest';
import {
  caseFold,
  equalsCaseInsensitive,
  isCaughtOwnershipMode,
  normalizeOwnershipMode,
  stripDiacritics,
  toOwnershipApiValue,
} from '@shared-contracts/domain';

describe('shared domain normalizers', () => {
  it('normalizes ownership modes with caught fallback', () => {
    expect(normalizeOwnershipMode('caught')).toBe('caught');
    expect(normalizeOwnershipMode('trade')).toBe('trade');
    expect(normalizeOwnershipMode('wanted')).toBe('wanted');
    expect(normalizeOwnershipMode(undefined)).toBe('caught');
    expect(normalizeOwnershipMode(null)).toBe('caught');
  });

  it('maps ownership mode to canonical API value', () => {
    expect(toOwnershipApiValue('caught')).toBe('caught');
    expect(toOwnershipApiValue('trade')).toBe('trade');
    expect(toOwnershipApiValue('wanted')).toBe('wanted');
  });

  it('detects caught mode only when normalized value is caught', () => {
    expect(isCaughtOwnershipMode('caught')).toBe(true);
    expect(isCaughtOwnershipMode('trade')).toBe(false);
    expect(isCaughtOwnershipMode(undefined)).toBe(true);
  });

  it('applies case-folding helpers consistently', () => {
    expect(caseFold('ChernoB8ta')).toBe('chernob8ta');
    expect(equalsCaseInsensitive('ChernoB8ta', 'chernob8ta')).toBe(true);
    expect(equalsCaseInsensitive('Ash', 'Misty')).toBe(false);
  });

  it('strips diacritics but preserves base text', () => {
    expect(stripDiacritics('Pokémon São')).toBe('Pokemon Sao');
  });
});
