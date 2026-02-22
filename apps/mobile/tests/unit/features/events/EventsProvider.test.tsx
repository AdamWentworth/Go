import React from 'react';
import { Button, Text } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { EventsProvider, useEvents } from '../../../../src/features/events/EventsProvider';
import { fetchMissedUpdates } from '../../../../src/services/eventsService';

jest.mock('../../../../src/features/auth/AuthProvider', () => ({
  useAuth: () => ({
    status: 'authenticated',
    user: { user_id: 'u1', username: 'ash' },
  }),
}));

jest.mock('../../../../src/features/events/eventsSession', () => ({
  getOrCreateDeviceId: jest.fn().mockResolvedValue('device-1'),
  loadLastEventsTimestamp: jest.fn().mockResolvedValue(1000),
  saveLastEventsTimestamp: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../../src/services/eventsService', () => ({
  fetchMissedUpdates: jest.fn(),
  hasEventsDelta: (payload: { pokemon: Record<string, unknown>; trade: Record<string, unknown>; relatedInstances: Record<string, unknown> }) =>
    Object.keys(payload.pokemon).length > 0 ||
    Object.keys(payload.trade).length > 0 ||
    Object.keys(payload.relatedInstances).length > 0,
}));

const mockedFetchMissedUpdates = fetchMissedUpdates as jest.MockedFunction<typeof fetchMissedUpdates>;

const Probe = () => {
  const { deviceId, eventVersion, refreshNow } = useEvents();
  return (
    <>
      <Text testID="device">{deviceId ?? '-'}</Text>
      <Text testID="version">{String(eventVersion)}</Text>
      <Button title="refresh" onPress={() => void refreshNow()} />
    </>
  );
};

describe('EventsProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('bootstraps device session and increments eventVersion when updates arrive', async () => {
    mockedFetchMissedUpdates.mockResolvedValue({
      pokemon: { i1: { instance_id: 'i1' } as never },
      trade: {},
      relatedInstances: {},
    });

    render(
      <EventsProvider>
        <Probe />
      </EventsProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('device').props.children).toBe('device-1');
      expect(screen.getByTestId('version').props.children).toBe('1');
    });
  });

  it('supports manual refresh via context function', async () => {
    mockedFetchMissedUpdates.mockResolvedValue({
      pokemon: {},
      trade: { t1: { trade_id: 't1', trade_status: 'pending' } as never },
      relatedInstances: {},
    });

    render(
      <EventsProvider>
        <Probe />
      </EventsProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('device').props.children).toBe('device-1');
    });

    await act(async () => {
      fireEvent.press(screen.getByText('refresh'));
    });

    await waitFor(() => {
      const version = Number(screen.getByTestId('version').props.children);
      expect(version).toBeGreaterThan(0);
    });
  });
});
