import { beforeEach, describe, expect, it, vi } from 'vitest';

const dbMocks = vi.hoisted(() => ({
  getBatchedPokemonUpdates: vi.fn(),
  getBatchedTradeUpdates: vi.fn(),
}));

vi.mock('@/db/indexedDB', () => ({
  getBatchedPokemonUpdates: dbMocks.getBatchedPokemonUpdates,
  getBatchedTradeUpdates: dbMocks.getBatchedTradeUpdates,
}));

import { checkBatchedUpdates } from '@/stores/BatchedUpdates/checkBatchedUpdates';

describe('checkBatchedUpdates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('triggers periodic updates when pokemon batched updates exist', async () => {
    dbMocks.getBatchedPokemonUpdates.mockResolvedValue([{ key: 'p-1' }]);
    dbMocks.getBatchedTradeUpdates.mockResolvedValue([]);

    const periodicUpdates = vi.fn();
    await checkBatchedUpdates(periodicUpdates);

    expect(periodicUpdates).toHaveBeenCalledTimes(1);
  });

  it('triggers periodic updates when trade batched updates exist', async () => {
    dbMocks.getBatchedPokemonUpdates.mockResolvedValue([]);
    dbMocks.getBatchedTradeUpdates.mockResolvedValue([{ key: 't-1' }]);

    const periodicUpdates = vi.fn();
    await checkBatchedUpdates(periodicUpdates);

    expect(periodicUpdates).toHaveBeenCalledTimes(1);
  });

  it('does not trigger periodic updates when no batched updates exist', async () => {
    dbMocks.getBatchedPokemonUpdates.mockResolvedValue([]);
    dbMocks.getBatchedTradeUpdates.mockResolvedValue([]);

    const periodicUpdates = vi.fn();
    await checkBatchedUpdates(periodicUpdates);

    expect(periodicUpdates).not.toHaveBeenCalled();
  });

  it('swallows IndexedDB read errors and logs them', async () => {
    const error = new Error('db read failed');
    dbMocks.getBatchedPokemonUpdates.mockRejectedValue(error);
    dbMocks.getBatchedTradeUpdates.mockResolvedValue([]);

    const periodicUpdates = vi.fn();
    await expect(checkBatchedUpdates(periodicUpdates)).resolves.toBeUndefined();

    expect(periodicUpdates).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });
});
