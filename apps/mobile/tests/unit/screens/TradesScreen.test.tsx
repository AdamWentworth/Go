import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { TradesScreen } from '../../../src/screens/TradesScreen';
import { sendTradeUpdate } from '../../../src/services/receiverService';
import { fetchTradesOverviewForUser } from '../../../src/services/tradesService';
import type { AlertButton } from 'react-native';

jest.mock('../../../src/features/auth/AuthProvider', () => ({
  useAuth: () => ({
    user: { user_id: 'u1', username: 'ash' },
  }),
}));

jest.mock('../../../src/services/tradesService', () => ({
  fetchTradesOverviewForUser: jest.fn(),
}));

jest.mock('../../../src/services/receiverService', () => ({
  sendTradeUpdate: jest.fn(),
}));

const mockedFetchTradesOverviewForUser =
  fetchTradesOverviewForUser as jest.MockedFunction<typeof fetchTradesOverviewForUser>;
const mockedSendTradeUpdate = sendTradeUpdate as jest.MockedFunction<typeof sendTradeUpdate>;

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
  const mockAlert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

  const confirmLastAlert = async () => {
    const calls = mockAlert.mock.calls;
    const lastCall = calls[calls.length - 1];
    const buttons = (lastCall?.[2] ?? []) as AlertButton[];
    const confirmAction = buttons.find((button) => button.text === 'Confirm');
    await act(async () => {
      confirmAction?.onPress?.();
    });
  };

  const cancelLastAlert = async () => {
    const calls = mockAlert.mock.calls;
    const lastCall = calls[calls.length - 1];
    const buttons = (lastCall?.[2] ?? []) as AlertButton[];
    const cancelAction = buttons.find((button) => button.text === 'Cancel');
    await act(async () => {
      cancelAction?.onPress?.();
    });
  };

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
    expect(screen.getByText('proposed - t1')).toBeTruthy();
    fireEvent.press(screen.getByText('proposed - t1'));
    expect(screen.getByText('Allowed actions: accept, deny, cancel, delete')).toBeTruthy();
    expect(screen.getByText('Trade proposed. Waiting for the other trainer to accept.')).toBeTruthy();
  });

  it('accept action mutates selected trade and syncs via receiver update', async () => {
    mockedFetchTradesOverviewForUser.mockResolvedValue({
      statusCounts: { proposed: 2 },
      trades: [
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
      ],
    });
    mockedSendTradeUpdate.mockResolvedValue({});

    render(<TradesScreen navigation={baseNavigation as never} route={route as never} />);

    fireEvent.press(screen.getByText('Load Trades'));

    await waitFor(() => {
      expect(screen.getByText('proposed - t1')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('proposed - t1'));
    fireEvent.press(screen.getByText('Accept'));
    expect(mockAlert).toHaveBeenCalled();
    await confirmLastAlert();

    await waitFor(() => {
      expect(mockedSendTradeUpdate).toHaveBeenCalled();
    });

    expect(mockedSendTradeUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: 'updateTrade',
        tradeData: expect.objectContaining({
          trade_id: 't1',
          trade_status: 'pending',
        }),
      }),
    );
    expect(screen.getByText('Last sync: success')).toBeTruthy();
  });

  it('shows retry after mutation sync failure and retries successfully', async () => {
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
    mockedSendTradeUpdate
      .mockRejectedValueOnce(new Error('receiver unavailable'))
      .mockResolvedValue({});

    render(<TradesScreen navigation={baseNavigation as never} route={route as never} />);

    fireEvent.press(screen.getByText('Load Trades'));

    await waitFor(() => {
      expect(screen.getByText('proposed - t1')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('proposed - t1'));
    fireEvent.press(screen.getByText('Accept'));
    await confirmLastAlert();

    await waitFor(() => {
      expect(screen.getByText(/Trade update failed to sync/i)).toBeTruthy();
      expect(screen.getByText('Last sync: failed')).toBeTruthy();
      expect(screen.getByText('Retry Last Update')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Retry Last Update'));

    await waitFor(() => {
      expect(mockedSendTradeUpdate).toHaveBeenCalledTimes(2);
      expect(screen.getByText('Last sync: success')).toBeTruthy();
    });
  });

  it('does not mutate when confirmation is cancelled', async () => {
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
    mockedSendTradeUpdate.mockResolvedValue({});

    render(<TradesScreen navigation={baseNavigation as never} route={route as never} />);
    fireEvent.press(screen.getByText('Load Trades'));
    await waitFor(() => {
      expect(screen.getByText('proposed - t1')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('proposed - t1'));
    fireEvent.press(screen.getByText('Accept'));
    await cancelLastAlert();

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalled();
    });
    expect(mockedSendTradeUpdate).not.toHaveBeenCalled();
  });
});
