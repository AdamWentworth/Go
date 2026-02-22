import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { AlertButton } from 'react-native';
import { TradesScreen } from '../../../src/screens/TradesScreen';
import { sendTradeUpdate } from '../../../src/services/receiverService';
import { revealTradePartnerInfo } from '../../../src/services/tradePartnerService';
import { fetchTradesOverviewForUser } from '../../../src/services/tradesService';

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

jest.mock('../../../src/services/tradePartnerService', () => ({
  revealTradePartnerInfo: jest.fn(),
}));

const mockedFetchTradesOverviewForUser =
  fetchTradesOverviewForUser as jest.MockedFunction<typeof fetchTradesOverviewForUser>;
const mockedSendTradeUpdate = sendTradeUpdate as jest.MockedFunction<typeof sendTradeUpdate>;
const mockedRevealTradePartnerInfo =
  revealTradePartnerInfo as jest.MockedFunction<typeof revealTradePartnerInfo>;

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
    expect(screen.getByText('No audit timestamps yet.')).toBeTruthy();
  });

  it('filters rows by status view pills', async () => {
    mockedFetchTradesOverviewForUser.mockResolvedValue({
      statusCounts: { proposed: 1, pending: 1 },
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
          trade_status: 'pending',
          username_proposed: 'ash',
          username_accepting: 'gary',
          pokemon_instance_id_user_proposed: 'i3',
          pokemon_instance_id_user_accepting: 'i4',
        },
      ],
    });

    render(<TradesScreen navigation={baseNavigation as never} route={route as never} />);
    fireEvent.press(screen.getByText('Load Trades'));

    await waitFor(() => {
      expect(screen.getByText('proposed - t1')).toBeTruthy();
      expect(screen.getByText('pending - t2')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('status-filter-pending'));

    await waitFor(() => {
      expect(screen.queryByText('proposed - t1')).toBeNull();
      expect(screen.getByText('pending - t2')).toBeTruthy();
    });
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

  it('toggles satisfaction for completed trade and syncs update', async () => {
    mockedFetchTradesOverviewForUser.mockResolvedValue({
      statusCounts: { completed: 1 },
      trades: [
        {
          trade_id: 't1',
          trade_status: 'completed',
          username_proposed: 'ash',
          username_accepting: 'misty',
          user_1_trade_satisfaction: false,
          user_2_trade_satisfaction: false,
          pokemon_instance_id_user_proposed: 'i1',
          pokemon_instance_id_user_accepting: 'i2',
        },
      ],
    });
    mockedSendTradeUpdate.mockResolvedValue({});

    render(<TradesScreen navigation={baseNavigation as never} route={route as never} />);
    fireEvent.press(screen.getByText('Load Trades'));

    await waitFor(() => {
      expect(screen.getByText('completed - t1')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('completed - t1'));
    fireEvent.press(screen.getByText('Toggle Satisfaction'));
    await confirmLastAlert();

    await waitFor(() => {
      expect(mockedSendTradeUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'updateTrade',
          tradeData: expect.objectContaining({
            trade_id: 't1',
            user_1_trade_satisfaction: true,
          }),
        }),
      );
    });
  });

  it('reveals partner info for selected pending trade', async () => {
    mockedFetchTradesOverviewForUser.mockResolvedValue({
      statusCounts: { pending: 1 },
      trades: [
        {
          trade_id: 't1',
          trade_status: 'pending',
          username_proposed: 'ash',
          username_accepting: 'misty',
          pokemon_instance_id_user_proposed: 'i1',
          pokemon_instance_id_user_accepting: 'i2',
        },
      ],
    });
    mockedRevealTradePartnerInfo.mockResolvedValue({
      trainerCode: '1111 2222 3333',
      pokemonGoName: 'Misty',
      location: 'Cerulean',
      coordinates: {
        latitude: 47.6,
        longitude: -122.3,
      },
    });

    render(<TradesScreen navigation={baseNavigation as never} route={route as never} />);
    fireEvent.press(screen.getByText('Load Trades'));

    await waitFor(() => {
      expect(screen.getByText('pending - t1')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('pending - t1'));
    fireEvent.press(screen.getByText('Reveal Partner Info'));

    await waitFor(() => {
      expect(mockedRevealTradePartnerInfo).toHaveBeenCalledWith(
        expect.objectContaining({ trade_id: 't1' }),
      );
      expect(screen.getByText('Trainer: Misty')).toBeTruthy();
      expect(screen.getByText('Code: 1111 2222 3333')).toBeTruthy();
    });
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

  it('shows completion guard hint when viewer already confirmed completion', async () => {
    mockedFetchTradesOverviewForUser.mockResolvedValue({
      statusCounts: { pending: 1 },
      trades: [
        {
          trade_id: 't1',
          trade_status: 'pending',
          username_proposed: 'ash',
          username_accepting: 'misty',
          user_proposed_completion_confirmed: true,
          pokemon_instance_id_user_proposed: 'i1',
          pokemon_instance_id_user_accepting: 'i2',
        },
      ],
    });
    mockedSendTradeUpdate.mockResolvedValue({});

    render(<TradesScreen navigation={baseNavigation as never} route={route as never} />);
    fireEvent.press(screen.getByText('Load Trades'));
    await waitFor(() => {
      expect(screen.getByText('pending - t1')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('pending - t1'));
    expect(screen.getByText('complete: you already confirmed completion.')).toBeTruthy();
  });
});
