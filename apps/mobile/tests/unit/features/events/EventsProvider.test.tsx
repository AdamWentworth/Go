import React from 'react';
import { Button, Text } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { EventsProvider, useEvents } from '../../../../src/features/events/EventsProvider';
import { fetchMissedUpdates, fetchSseStreamToken } from '../../../../src/services/eventsService';

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
  fetchSseStreamToken: jest.fn(),
  hasEventsDelta: (payload: { pokemon: Record<string, unknown>; trade: Record<string, unknown>; relatedInstances: Record<string, unknown> }) =>
    Object.keys(payload.pokemon).length > 0 ||
    Object.keys(payload.trade).length > 0 ||
    Object.keys(payload.relatedInstances).length > 0,
}));

const mockedFetchMissedUpdates = fetchMissedUpdates as jest.MockedFunction<typeof fetchMissedUpdates>;
const mockedFetchSseStreamToken = fetchSseStreamToken as jest.MockedFunction<typeof fetchSseStreamToken>;

const Probe = () => {
  const { deviceId, eventVersion, transport, connected, refreshNow } = useEvents();
  return (
    <>
      <Text testID="device">{deviceId ?? '-'}</Text>
      <Text testID="version">{String(eventVersion)}</Text>
      <Text testID="transport">{transport}</Text>
      <Text testID="connected">{String(connected)}</Text>
      <Button title="refresh" onPress={() => void refreshNow()} />
    </>
  );
};

describe('EventsProvider', () => {
  jest.setTimeout(15000);

  const originalEventSource = (globalThis as { EventSource?: unknown }).EventSource;
  const originalConsoleError = console.error;
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      const first = args[0];
      if (typeof first === 'string' && first.includes('not wrapped in act')) {
        return;
      }
      originalConsoleError(...(args as Parameters<typeof console.error>));
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    delete (globalThis as { EventSource?: unknown }).EventSource;
    mockedFetchSseStreamToken.mockResolvedValue(null);
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
    if (originalEventSource) {
      (globalThis as { EventSource?: unknown }).EventSource = originalEventSource;
    } else {
      delete (globalThis as { EventSource?: unknown }).EventSource;
    }
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
      expect(screen.getByTestId('transport').props.children).toBe('polling');
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

  it('switches to SSE transport when EventSource runtime is available', async () => {
    const EventSourceMock = jest.fn().mockImplementation(() => {
      return {
        onopen: null,
        onerror: null,
        onmessage: null,
        close: jest.fn(),
      };
    });
    (globalThis as { EventSource?: unknown }).EventSource = EventSourceMock;

    mockedFetchMissedUpdates.mockResolvedValue({
      pokemon: {},
      trade: {},
      relatedInstances: {},
    });
    mockedFetchSseStreamToken.mockResolvedValue('stream-token');

    render(
      <EventsProvider>
        <Probe />
      </EventsProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('device').props.children).toBe('device-1');
      expect(screen.getByTestId('transport').props.children).toBe('sse');
      expect(EventSourceMock).toHaveBeenCalled();
    });
    expect(EventSourceMock.mock.calls[0]?.[0]).toContain('stream_token=stream-token');
  });

  it('deduplicates repeated payloads during reconciliation', async () => {
    mockedFetchMissedUpdates.mockResolvedValue({
      pokemon: {},
      trade: {
        t1: { trade_id: 't1', trade_status: 'pending' } as never,
      },
      relatedInstances: {},
    });

    render(
      <EventsProvider>
        <Probe />
      </EventsProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('transport').props.children).toBe('polling');
    });

    await act(async () => {
      fireEvent.press(screen.getByText('refresh'));
    });

    await waitFor(() => {
      expect(Number(screen.getByTestId('version').props.children)).toBe(1);
    });
  });
});
