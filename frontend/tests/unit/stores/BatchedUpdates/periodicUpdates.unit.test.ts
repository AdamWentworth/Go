import { beforeEach, describe, expect, it, vi } from 'vitest';

const dbMocks = vi.hoisted(() => ({
  getBatchedPokemonUpdates: vi.fn(),
  getBatchedTradeUpdates: vi.fn(),
}));

vi.mock('@/db/indexedDB', () => ({
  getBatchedPokemonUpdates: dbMocks.getBatchedPokemonUpdates,
  getBatchedTradeUpdates: dbMocks.getBatchedTradeUpdates,
}));

import { periodicUpdates } from '@/stores/BatchedUpdates/periodicUpdates';

type Ref<T> = { current: T };

const setLoggedIn = () => {
  localStorage.setItem(
    'user',
    JSON.stringify({
      refreshTokenExpiry: new Date(Date.now() + 5 * 60_000).toISOString(),
    }),
  );
};

const setLoggedOut = () => {
  localStorage.removeItem('user');
};

describe('periodicUpdates', () => {
  let postMessage: ReturnType<typeof vi.fn>;
  let scheduledRef: Ref<boolean | null>;
  let timerRef: Ref<NodeJS.Timeout | null>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    postMessage = vi.fn();
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        ready: Promise.resolve({
          active: { postMessage },
        }),
      },
    });

    scheduledRef = { current: null };
    timerRef = { current: null };
    setLoggedOut();
  });

  it('does not schedule updates when user is logged out', async () => {
    const run = periodicUpdates(scheduledRef, timerRef);
    run();

    await vi.runAllTicks();

    expect(postMessage).not.toHaveBeenCalled();
    expect(scheduledRef.current).toBeNull();
    expect(timerRef.current).toBeNull();
  });

  it('sends immediately and schedules timer when user is logged in', async () => {
    setLoggedIn();
    dbMocks.getBatchedPokemonUpdates.mockResolvedValue([]);
    dbMocks.getBatchedTradeUpdates.mockResolvedValue([]);

    const run = periodicUpdates(scheduledRef, timerRef);
    run();
    await vi.runAllTicks();

    expect(postMessage).toHaveBeenCalledTimes(1);
    expect(scheduledRef.current).toBe(true);
    expect(timerRef.current).not.toBeNull();
  });

  it('stops periodic loop when no batched updates remain', async () => {
    setLoggedIn();
    dbMocks.getBatchedPokemonUpdates.mockResolvedValue([]);
    dbMocks.getBatchedTradeUpdates.mockResolvedValue([]);

    const run = periodicUpdates(scheduledRef, timerRef);
    run();
    await vi.runAllTicks();

    await vi.advanceTimersByTimeAsync(60_000);

    expect(dbMocks.getBatchedPokemonUpdates).toHaveBeenCalledTimes(1);
    expect(dbMocks.getBatchedTradeUpdates).toHaveBeenCalledTimes(1);
    expect(postMessage).toHaveBeenCalledTimes(1);
    expect(scheduledRef.current).toBeNull();
    expect(timerRef.current).toBeNull();
  });

  it('reschedules and sends when batched updates still exist and user is logged in', async () => {
    setLoggedIn();
    dbMocks.getBatchedPokemonUpdates.mockResolvedValue([{ key: 'pokemon-1' }]);
    dbMocks.getBatchedTradeUpdates.mockResolvedValue([]);

    const run = periodicUpdates(scheduledRef, timerRef);
    run();
    await vi.runAllTicks();

    await vi.advanceTimersByTimeAsync(60_000);
    await vi.runAllTicks();

    expect(postMessage).toHaveBeenCalledTimes(2);
    expect(scheduledRef.current).toBe(true);
    expect(timerRef.current).not.toBeNull();
  });

  it('pauses periodic loop when updates exist but user logs out before timer fires', async () => {
    setLoggedIn();
    dbMocks.getBatchedPokemonUpdates.mockResolvedValue([{ key: 'pokemon-1' }]);
    dbMocks.getBatchedTradeUpdates.mockResolvedValue([]);

    const run = periodicUpdates(scheduledRef, timerRef);
    run();
    await vi.runAllTicks();

    setLoggedOut();
    await vi.advanceTimersByTimeAsync(60_000);

    expect(postMessage).toHaveBeenCalledTimes(1);
    expect(scheduledRef.current).toBeNull();
    expect(timerRef.current).toBeNull();
  });
});
