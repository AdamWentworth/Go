import { describe, expect, it, vi, beforeEach } from 'vitest';

import { handleCompleteTrade } from '@/pages/Trades/handlers/handleCompleteTrade';

vi.mock('@/db/indexedDB', () => ({
  putBatchedTradeUpdates: vi.fn(async () => undefined),
}));

const baseTrade = {
  trade_id: 'trade-1',
  username_proposed: 'ash',
  username_accepting: 'misty',
  user_proposed_completion_confirmed: false,
  user_accepting_completion_confirmed: true,
  trade_status: 'pending',
  last_update: 1000,
  pokemon_instance_id_user_proposed: 'inst-proposed',
  pokemon_instance_id_user_accepting: 'inst-accepting',
};

describe('handleCompleteTrade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses canonical instances + setInstances fields and swaps usernames on completion', async () => {
    const setTradeData = vi.fn(async () => undefined);
    const setInstances = vi.fn();
    const periodicUpdates = vi.fn();

    const instances = {
      'inst-proposed': { username: 'ash' },
      'inst-accepting': { username: 'misty' },
    };

    const result = await handleCompleteTrade({
      trade: { ...baseTrade },
      trades: { [baseTrade.trade_id]: { ...baseTrade } },
      setTradeData,
      periodicUpdates,
      relatedInstances: {},
      instances,
      setInstances,
      currentUsername: 'ash',
    });

    expect(result.trade_status).toBe('completed');
    expect(setInstances).toHaveBeenCalledWith({
      'inst-proposed': { username: 'misty' },
      'inst-accepting': { username: 'ash' },
    });
    expect(setTradeData).toHaveBeenCalledTimes(1);
    expect(periodicUpdates).toHaveBeenCalledTimes(1);
  });

  it('prefers relatedInstances data over instances map when both exist', async () => {
    const setTradeData = vi.fn(async () => undefined);
    const setInstances = vi.fn();
    const periodicUpdates = vi.fn();

    const instances = {
      'inst-proposed': { username: 'ash' },
      'inst-accepting': { username: 'misty' },
    };
    const relatedInstances = {
      'inst-proposed': { username: 'ashRelated' },
      'inst-accepting': { username: 'mistyRelated' },
    };

    await handleCompleteTrade({
      trade: { ...baseTrade },
      trades: { [baseTrade.trade_id]: { ...baseTrade } },
      setTradeData,
      periodicUpdates,
      relatedInstances,
      instances,
      setInstances,
      currentUsername: 'ash',
    });

    expect(setInstances).toHaveBeenCalledWith({
      'inst-proposed': { username: 'misty' },
      'inst-accepting': { username: 'ash' },
    });
    expect(setTradeData).toHaveBeenCalledTimes(1);
    expect(periodicUpdates).toHaveBeenCalledTimes(1);
  });
});
