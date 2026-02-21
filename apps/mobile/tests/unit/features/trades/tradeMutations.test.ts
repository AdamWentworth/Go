import {
  acceptTrade,
  buildStatusCounts,
  completeTrade,
  reproposeTrade,
  toTradeMap,
  toTradeRows,
  type TradeRow,
} from '../../../../src/features/trades/tradeMutations';

describe('tradeMutations', () => {
  it('acceptTrade marks selected trade pending and deletes conflicting proposed trades', () => {
    const rows: TradeRow[] = [
      {
        trade_id: 't1',
        trade_status: 'proposed',
        username_proposed: 'ash',
        username_accepting: 'misty',
        pokemon_instance_id_user_proposed: 'i1',
        pokemon_instance_id_user_accepting: 'i2',
      },
      {
        trade_id: 't2',
        trade_status: 'proposed',
        username_proposed: 'brock',
        username_accepting: 'gary',
        pokemon_instance_id_user_proposed: 'i7',
        pokemon_instance_id_user_accepting: 'i2',
      },
      {
        trade_id: 't3',
        trade_status: 'pending',
        username_proposed: 'jessie',
        username_accepting: 'james',
        pokemon_instance_id_user_proposed: 'i9',
        pokemon_instance_id_user_accepting: 'i10',
      },
    ];

    const { next, changed } = acceptTrade(toTradeMap(rows), 't1');

    expect(next.t1.trade_status).toBe('pending');
    expect(next.t2.trade_status).toBe('deleted');
    expect(next.t3.trade_status).toBe('pending');
    expect(changed.map((row) => row.trade_id).sort()).toEqual(['t1', 't2']);
  });

  it('completeTrade requires both users and then marks trade completed', () => {
    const base: TradeRow[] = [
      {
        trade_id: 't1',
        trade_status: 'pending',
        username_proposed: 'ash',
        username_accepting: 'misty',
        user_proposed_completion_confirmed: false,
        user_accepting_completion_confirmed: false,
      },
    ];

    const first = completeTrade(toTradeMap(base), 't1', 'ash');
    expect(first.next.t1.trade_status).toBe('pending');
    expect(first.next.t1.user_proposed_completion_confirmed).toBe(true);
    expect(first.next.t1.user_accepting_completion_confirmed).toBe(false);

    const second = completeTrade(first.next, 't1', 'misty');
    expect(second.next.t1.trade_status).toBe('completed');
    expect(second.next.t1.user_proposed_completion_confirmed).toBe(true);
    expect(second.next.t1.user_accepting_completion_confirmed).toBe(true);
    expect(typeof second.next.t1.trade_completed_date).toBe('string');
  });

  it('reproposeTrade resets terminal fields and swaps proposer when needed', () => {
    const map = toTradeMap([
      {
        trade_id: 't1',
        trade_status: 'denied',
        username_proposed: 'ash',
        username_accepting: 'misty',
        trade_accepted_date: '2026-01-01T00:00:00.000Z',
        trade_completed_date: '2026-01-02T00:00:00.000Z',
        trade_cancelled_date: '2026-01-03T00:00:00.000Z',
        trade_cancelled_by: 'ash',
        trade_deleted_date: '2026-01-04T00:00:00.000Z',
      },
    ]);

    const { next } = reproposeTrade(map, 't1', 'misty');

    expect(next.t1.trade_status).toBe('proposed');
    expect(next.t1.username_proposed).toBe('misty');
    expect(next.t1.username_accepting).toBe('ash');
    expect(next.t1.trade_accepted_date).toBeNull();
    expect(next.t1.trade_completed_date).toBeNull();
    expect(next.t1.trade_cancelled_date).toBeNull();
    expect(next.t1.trade_cancelled_by).toBeNull();
    expect(next.t1.trade_deleted_date).toBeNull();
  });

  it('buildStatusCounts and toTradeRows return consistent grouped/sorted rows', () => {
    const rows: TradeRow[] = [
      { trade_id: 'a', trade_status: 'pending', last_update: 10 },
      { trade_id: 'b', trade_status: 'proposed', last_update: 30 },
      { trade_id: 'c', trade_status: 'pending', last_update: 20 },
    ];

    const sorted = toTradeRows(toTradeMap(rows));
    expect(sorted.map((row) => row.trade_id)).toEqual(['b', 'c', 'a']);

    const counts = buildStatusCounts(sorted);
    expect(counts).toEqual({ proposed: 1, pending: 2 });
  });
});

