import { describe, expect, it } from 'vitest';
import { getEntityKey } from '@/pages/Pokemon/features/instances/utils/getEntityKey';

describe('getEntityKey', () => {
  it('prefers instance_id when present', () => {
    expect(
      getEntityKey({
        instanceData: { instance_id: 'instance-1' },
        variant_id: 'variant-1',
      }),
    ).toBe('instance-1');
  });

  it('falls back to variant_id', () => {
    expect(
      getEntityKey({
        variant_id: 'variant-2',
      }),
    ).toBe('variant-2');
  });

  it('returns empty string when only unknown key fields exist', () => {
    expect(
      getEntityKey({
        legacyKey: 'legacy-3',
      } as unknown as Parameters<typeof getEntityKey>[0]),
    ).toBe('');
  });

  it('returns empty string when no key fields exist', () => {
    expect(getEntityKey({})).toBe('');
    expect(getEntityKey(null)).toBe('');
    expect(getEntityKey(undefined)).toBe('');
  });
});
