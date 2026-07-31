import { beforeEach, describe, expect, it, vi } from 'vitest';

const dbMocks = vi.hoisted(() => ({
  setTradesinDB: vi.fn(),
  deleteFromTradesDB: vi.fn(),
  getAllFromTradesDB: vi.fn(),
}));

vi.mock('@/db/indexedDB', () => ({
  POKEMON_TRADES_STORE: 'pokemonTrades',
  RELATED_INSTANCES_STORE: 'relatedInstances',
  setTradesinDB: dbMocks.setTradesinDB,
  deleteFromTradesDB: dbMocks.deleteFromTradesDB,
  getAllFromTradesDB: dbMocks.getAllFromTradesDB,
}));

vi.mock('@/services/tradeService', () => ({
  fetchTrades: vi.fn(),
}));

vi.mock('@/features/trades/actions/proposeTrade', () => ({
  proposeTrade: vi.fn(),
}));

import { useTradeStore } from '@/features/trades/store/useTradeStore';

describe('useTradeStore authoritative reconciliation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.setTradesinDB.mockResolvedValue(undefined);
    dbMocks.deleteFromTradesDB.mockResolvedValue(undefined);
    useTradeStore.getState().resetTradeData();
  });

  it('updates visible state immediately from a canonical command response', async () => {
    const pendingWrite = new Promise<void>(() => {});
    dbMocks.setTradesinDB.mockReturnValue(pendingWrite);

    const update = useTradeStore.getState().setTradeData({
      'trade-1': { trade_id: 'trade-1', trade_status: 'cancelled' },
    });

    expect(useTradeStore.getState().trades['trade-1']?.trade_status).toBe('cancelled');
    void update;
  });

  it('keeps canonical memory state when IndexedDB persistence fails', async () => {
    dbMocks.setTradesinDB.mockRejectedValue(new Error('IndexedDB unavailable'));

    await expect(
      useTradeStore.getState().setTradeData({
        'trade-1': { trade_id: 'trade-1', trade_status: 'pending' },
      }),
    ).resolves.toBeDefined();

    expect(useTradeStore.getState().trades['trade-1']?.trade_status).toBe('pending');
  });

  it('removes server-deleted trades from memory even when cache deletion fails', async () => {
    await useTradeStore.getState().setTradeData({
      'trade-1': { trade_id: 'trade-1', trade_status: 'proposed' },
    });
    dbMocks.deleteFromTradesDB.mockRejectedValue(new Error('IndexedDB unavailable'));

    await useTradeStore.getState().setTradeData({
      'trade-1': { trade_id: 'trade-1', trade_status: 'deleted' },
    });

    expect(useTradeStore.getState().trades).not.toHaveProperty('trade-1');
  });
});
