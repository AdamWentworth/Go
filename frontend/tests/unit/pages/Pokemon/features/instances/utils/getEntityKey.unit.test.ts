import { describe, expect, it } from 'vitest';
import { getEntityKey } from '@/pages/Pokemon/features/instances/utils/getEntityKey';

describe('getEntityKey', () => {
  it('prefers instance_id when present', () => {
    expect(
      getEntityKey({
        instanceData: { instance_id: 'instance-1' },
        variant_id: 'variant-1',
        pokemonKey: 'legacy-1',
      }),
    ).toBe('instance-1');
  });

  it('falls back to variant_id', () => {
    expect(
      getEntityKey({
        variant_id: 'variant-2',
        pokemonKey: 'legacy-2',
      }),
    ).toBe('variant-2');
  });

  it('falls back to legacy pokemonKey', () => {
    expect(
      getEntityKey({
        pokemonKey: 'legacy-3',
      }),
    ).toBe('legacy-3');
  });

  it('returns empty string when no key fields exist', () => {
    expect(getEntityKey({})).toBe('');
    expect(getEntityKey(null)).toBe('');
    expect(getEntityKey(undefined)).toBe('');
  });
});

