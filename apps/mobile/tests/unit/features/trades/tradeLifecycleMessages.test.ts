import {
  buildTradeActionConfirmation,
  buildTradeStatusDetail,
} from '../../../../src/features/trades/tradeLifecycleMessages';
import type { TradeRow } from '../../../../src/features/trades/tradeMutations';

const baseTrade: TradeRow = {
  trade_id: 't1',
  trade_status: 'proposed',
  username_proposed: 'ash',
  username_accepting: 'misty',
  pokemon_instance_id_user_proposed: 'i1',
  pokemon_instance_id_user_accepting: 'i2',
};

describe('tradeLifecycleMessages', () => {
  it('builds confirmation content per action', () => {
    expect(buildTradeActionConfirmation('accept', baseTrade)).toEqual(
      expect.objectContaining({
        title: 'Accept trade?',
      }),
    );
    expect(buildTradeActionConfirmation('delete', baseTrade)).toEqual(
      expect.objectContaining({
        title: 'Delete trade?',
      }),
    );
  });

  it('builds status detail by lifecycle state', () => {
    expect(buildTradeStatusDetail(baseTrade, 'ash')).toContain('Waiting for the other trainer');
    expect(
      buildTradeStatusDetail(
        {
          ...baseTrade,
          trade_status: 'pending',
          trade_accepted_date: '2026-02-10T10:00:00.000Z',
        },
        'ash',
      ),
    ).toContain('accepted');
    expect(
      buildTradeStatusDetail(
        {
          ...baseTrade,
          trade_status: 'cancelled',
          trade_cancelled_by: 'ash',
        },
        'ash',
      ),
    ).toContain('cancelled');
  });
});
