import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EventsProvider } from '@/contexts/EventsContext';
import { fetchUpdates } from '@/services/sseService';
import { useSessionStore } from '@/stores/useSessionStore';

const mocks = vi.hoisted(() => ({
  authState: {
    isLoggedIn: true,
    user: {
      user_id: 'user-1',
      username: 'AdamZilla',
    },
  },
  setInstances: vi.fn(),
  updateTradeData: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ isLoading: false }),
}));

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: (selector?: (state: typeof mocks.authState) => unknown) =>
    selector ? selector(mocks.authState) : mocks.authState,
}));

vi.mock('@/features/variants/store/useVariantsStore', () => ({
  useVariantsStore: (selector: (state: { variantsLoading: boolean }) => unknown) =>
    selector({ variantsLoading: false }),
}));

vi.mock('@/features/instances/store/useInstancesStore', () => ({
  useInstancesStore: (
    selector: (state: {
      instancesLoading: boolean;
      setInstances: typeof mocks.setInstances;
    }) => unknown,
  ) =>
    selector({
      instancesLoading: false,
      setInstances: mocks.setInstances,
    }),
}));

vi.mock('@/features/trades/store/useTradeStore', () => ({
  useTradeStore: (
    selector: (state: { updateTradeData: typeof mocks.updateTradeData }) => unknown,
  ) => selector({ updateTradeData: mocks.updateTradeData }),
}));

vi.mock('@/utils/deviceID', () => ({
  getDeviceId: () => 'device-1',
}));

vi.mock('@/services/sseService', () => ({
  fetchUpdates: vi.fn().mockResolvedValue(null),
}));

class EventSourceMock {
  static readonly instances: EventSourceMock[] = [];

  readonly url: string;
  readonly withCredentials: boolean;
  onopen: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent<string>) => void) | null = null;
  close = vi.fn();

  constructor(url: string | URL, options?: EventSourceInit) {
    this.url = String(url);
    this.withCredentials = options?.withCredentials ?? false;
    EventSourceMock.instances.push(this);
  }
}

describe('EventsContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    EventSourceMock.instances.length = 0;
    vi.stubGlobal('EventSource', EventSourceMock);
    useSessionStore.setState({
      lastUpdateTimestamp: null,
      isSessionNew: false,
    });
  });

  it('initializes the session clock and opens an authenticated SSE stream', async () => {
    const view = render(
      <EventsProvider>
        <div>ready</div>
      </EventsProvider>,
    );

    await waitFor(() => expect(EventSourceMock.instances).toHaveLength(1));

    expect(useSessionStore.getState().lastUpdateTimestamp).toBeInstanceOf(Date);
    expect(fetchUpdates).toHaveBeenCalledWith(
      'user-1',
      'device-1',
      expect.any(String),
    );

    const stream = EventSourceMock.instances[0];
    expect(stream.withCredentials).toBe(true);
    expect(stream.url).toContain('/sse');
    expect(stream.url).toContain('device_id=device-1');

    view.unmount();
    expect(stream.close).toHaveBeenCalledTimes(1);
  });

  it('applies incoming Pokemon and trade updates from the stream', async () => {
    render(
      <EventsProvider>
        <div>ready</div>
      </EventsProvider>,
    );

    await waitFor(() => expect(EventSourceMock.instances).toHaveLength(1));

    const pokemon = {
      'instance-1': {
        pokemon_id: 25,
        is_caught: true,
      },
    };
    const trade = {
      'trade-1': {
        trade_status: 'proposed',
      },
    };
    const relatedInstance = {
      'instance-2': {
        pokemon_id: 133,
      },
    };

    act(() => {
      EventSourceMock.instances[0].onmessage?.(
        new MessageEvent('message', {
          data: JSON.stringify({ pokemon, trade, relatedInstance }),
        }),
      );
    });

    expect(mocks.setInstances).toHaveBeenCalledWith(pokemon);
    expect(mocks.updateTradeData).toHaveBeenCalledWith(trade, relatedInstance);
  });
});
