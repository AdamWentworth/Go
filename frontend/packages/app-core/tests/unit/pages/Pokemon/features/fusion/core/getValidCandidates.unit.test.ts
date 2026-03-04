import { describe, expect, it, vi } from 'vitest';
import { getValidCandidates } from '@/pages/Pokemon/features/fusion/core/getValidCandidates';

vi.mock('@/db/instancesDB', () => ({
  getAllInstances: vi.fn(),
}));

vi.mock('@/db/indexedDB', () => ({
  initVariantsDB: vi.fn(),
  VARIANTS_STORE: 'variants',
}));

import { getAllInstances } from '@/db/instancesDB';
import { initVariantsDB } from '@/db/indexedDB';

describe('getValidCandidates', () => {
  it('matches candidates by pokemon_id even when instance_id is not zero-padded', async () => {
    vi.mocked(getAllInstances).mockResolvedValue([
      {
        instance_id: '643-default_abc',
        variant_id: '643-default',
        pokemon_id: 643,
        is_caught: true,
        is_for_trade: false,
        is_fused: false,
        disabled: false,
        shiny: false,
      },
    ] as any);

    const dbGet = vi.fn().mockResolvedValue({ variant_id: '0643-default' });
    vi.mocked(initVariantsDB).mockResolvedValue({ get: dbGet } as any);

    const result = await getValidCandidates('0643', false, true);

    expect(result).toHaveLength(1);
    expect(dbGet).toHaveBeenCalledWith('variants', '643-default');
    expect(result[0]?.instanceData?.pokemon_id).toBe(643);
  });

  it('falls back to zero-padded variant lookup when unpadded key misses', async () => {
    vi.mocked(getAllInstances).mockResolvedValue([
      {
        instance_id: 'manual-instance-id',
        variant_id: '643-default',
        pokemon_id: 643,
        is_caught: true,
        is_for_trade: false,
        is_fused: false,
        disabled: false,
        shiny: false,
      },
    ] as any);

    const dbGet = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ variant_id: '0643-default' });
    vi.mocked(initVariantsDB).mockResolvedValue({ get: dbGet } as any);

    const result = await getValidCandidates('643', false, true);

    expect(result).toHaveLength(1);
    expect(dbGet).toHaveBeenNthCalledWith(1, 'variants', '643-default');
    expect(dbGet).toHaveBeenNthCalledWith(2, 'variants', '0643-default');
  });

  it('includes a forced instance id even when candidate is disabled and fused', async () => {
    vi.mocked(getAllInstances).mockResolvedValue([
      {
        instance_id: 'reshiram-instance-1',
        variant_id: '0643-default',
        pokemon_id: 643,
        is_caught: true,
        is_for_trade: false,
        is_fused: true,
        disabled: true,
        shiny: false,
      },
    ] as any);

    const dbGet = vi.fn().mockResolvedValue({ variant_id: '0643-default' });
    vi.mocked(initVariantsDB).mockResolvedValue({ get: dbGet } as any);

    const result = await getValidCandidates('0643', false, true, ['reshiram-instance-1']);

    expect(result).toHaveLength(1);
    expect(result[0]?.instanceData?.instance_id).toBe('reshiram-instance-1');
  });

  it('normalizes legacy variant-prefixed ids for forced id and fused_with link checks', async () => {
    vi.mocked(getAllInstances).mockResolvedValue([
      {
        instance_id: '79094536-4eec-4736-bcc7-e440d188eee5',
        variant_id: '0643-default',
        pokemon_id: 643,
        is_caught: true,
        is_for_trade: false,
        is_fused: true,
        disabled: true,
        fused_with: '0646-shiny_c9277c53-f26d-4370-bfec-d26a9278df64',
        shiny: false,
      },
    ] as any);

    const dbGet = vi.fn().mockResolvedValue({ variant_id: '0643-default' });
    vi.mocked(initVariantsDB).mockResolvedValue({ get: dbGet } as any);

    const result = await getValidCandidates(
      '0643',
      false,
      true,
      ['0643-default_79094536-4eec-4736-bcc7-e440d188eee5'],
      'c9277c53-f26d-4370-bfec-d26a9278df64',
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.instanceData?.instance_id).toBe('79094536-4eec-4736-bcc7-e440d188eee5');
  });

  it('includes linked partner when candidate is fused/disabled and linked to current instance', async () => {
    vi.mocked(getAllInstances).mockResolvedValue([
      {
        instance_id: 'reshiram-instance-linked',
        variant_id: '0643-default',
        pokemon_id: 643,
        is_caught: true,
        is_for_trade: false,
        is_fused: true,
        disabled: true,
        fused_with: 'kyurem-instance-open',
        shiny: false,
      },
    ] as any);

    const dbGet = vi.fn().mockResolvedValue({ variant_id: '0643-default' });
    vi.mocked(initVariantsDB).mockResolvedValue({ get: dbGet } as any);

    const result = await getValidCandidates('0643', false, true, [], 'kyurem-instance-open');

    expect(result).toHaveLength(1);
    expect(result[0]?.instanceData?.instance_id).toBe('reshiram-instance-linked');
  });

  it('resolves forced candidates missing variant_id/instance_id using pokemon_id + shiny fallback key', async () => {
    vi.mocked(getAllInstances).mockResolvedValue([
      {
        pokemon_id: 643,
        shiny: false,
        is_caught: true,
        is_for_trade: false,
        is_fused: true,
        disabled: true,
        fused_with: 'kyurem-open-id',
      },
    ] as any);

    const dbGet = vi.fn().mockResolvedValue({ variant_id: '0643-default' });
    vi.mocked(initVariantsDB).mockResolvedValue({ get: dbGet } as any);

    const result = await getValidCandidates(
      '0643',
      false,
      true,
      [],
      'kyurem-open-id',
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.variant_id).toBe('0643-default');
    expect(dbGet).toHaveBeenCalledWith('variants', '0643-default');
  });
});
