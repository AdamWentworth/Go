import { nativeTradeQueryKeys } from '../../../../src/features/trades/tradeQueries';

describe('native trade query keys', () => {
  it('isolates server-authoritative trade state by authenticated user', () => {
    expect(nativeTradeQueryKeys.list('user-1')).toEqual([
      'native',
      'trades',
      'user-1',
      'list',
    ]);
    expect(nativeTradeQueryKeys.list('user-1')).not.toEqual(
      nativeTradeQueryKeys.list('user-2'),
    );
  });
});
