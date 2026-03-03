import { fetchTradesOverviewForUser } from '../../../src/services/tradesService';
import { fetchUserOverview } from '../../../src/services/userOverviewService';

jest.mock('../../../src/services/userOverviewService', () => ({
  fetchUserOverview: jest.fn(),
}));

const mockedFetchUserOverview = fetchUserOverview as jest.MockedFunction<typeof fetchUserOverview>;

describe('tradesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds status counts and sorted trade rows', async () => {
    mockedFetchUserOverview.mockResolvedValue({
      user: { user_id: 'u1', username: 'ash' },
      pokemon_instances: {},
      related_instances: {},
      registrations: {},
      trades: {
        t1: { trade_id: 't1', trade_status: 'pending', last_update: 2 },
        t2: { trade_id: 't2', trade_status: 'proposed', last_update: 5 },
        t3: { trade_id: 't3', trade_status: 'pending', last_update: 1 },
      },
    } as never);

    const result = await fetchTradesOverviewForUser('u1');

    expect(result.statusCounts).toEqual({ proposed: 1, pending: 2 });
    expect(result.trades.map((trade) => trade.trade_id)).toEqual(['t2', 't1', 't3']);
  });
});

