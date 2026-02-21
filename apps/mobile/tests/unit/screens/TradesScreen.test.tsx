import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { TradesScreen } from '../../../src/screens/TradesScreen';
import { fetchTradesOverviewForUser } from '../../../src/services/tradesService';

jest.mock('../../../src/features/auth/AuthProvider', () => ({
  useAuth: () => ({
    user: { user_id: 'u1', username: 'ash' },
  }),
}));

jest.mock('../../../src/services/tradesService', () => ({
  fetchTradesOverviewForUser: jest.fn(),
}));

const mockedFetchTradesOverviewForUser =
  fetchTradesOverviewForUser as jest.MockedFunction<typeof fetchTradesOverviewForUser>;

const baseNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
};

const route = {
  key: 'Trades-key',
  name: 'Trades',
  params: undefined,
} as const;

describe('TradesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads trades and renders summary', async () => {
    mockedFetchTradesOverviewForUser.mockResolvedValue({
      statusCounts: { proposed: 1 },
      trades: [
        {
          trade_id: 't1',
          trade_status: 'proposed',
          username_proposed: 'ash',
          username_accepting: 'misty',
          pokemon_instance_id_user_proposed: 'i1',
          pokemon_instance_id_user_accepting: 'i2',
        },
      ],
    });

    render(<TradesScreen navigation={baseNavigation as never} route={route as never} />);

    fireEvent.press(screen.getByText('Load Trades'));

    await waitFor(() => {
      expect(mockedFetchTradesOverviewForUser).toHaveBeenCalledWith('u1');
    });

    expect(screen.getByText('proposed: 1')).toBeTruthy();
    expect(screen.getByText('proposed • t1')).toBeTruthy();
  });
});

