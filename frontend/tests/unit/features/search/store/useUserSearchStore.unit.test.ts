import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { useUserSearchStore } from '@/stores/useUserSearchStore';

const USERS_API_URL = import.meta.env.VITE_USERS_API_URL;
const CACHE_NAME = 'SearchCache';

const makeResponse = (
  status: number,
  body: unknown = {},
  headers?: Record<string, string>,
): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 404 ? 'Not Found' : 'OK',
    headers: new Headers(headers ?? {}),
    json: async () => body,
  }) as Response;

const deleteSearchDb = async () =>
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase(CACHE_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
    req.onblocked = () => resolve();
  });

describe.sequential('useUserSearchStore', () => {
  const fetchMock = vi.fn();

  beforeEach(async () => {
    await deleteSearchDb();
    localStorage.clear();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);

    useInstancesStore.setState({
      instances: {},
      foreignInstances: null,
      instancesLoading: false,
    });

    useUserSearchStore.setState({
      viewedInstances: null,
      canonicalUsername: null,
      foreignInstancesLoading: false,
      userExists: null,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches foreign instances from canonical endpoint and stores canonical username', async () => {
    const instances = {
      i1: { instance_id: 'i1', pokemon_id: 1, variant_id: '0001-default' },
    } as any;

    fetchMock.mockResolvedValueOnce(
      makeResponse(200, { username: 'FakeUser0632', instances }, { ETag: 'v1' }),
    );

    const canonical = await useUserSearchStore
      .getState()
      .fetchUserInstancesByUsername('fakeuser0632');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(
      `${USERS_API_URL}/instances/by-username/fakeuser0632`,
    );
    expect(canonical).toBe('FakeUser0632');

    const state = useUserSearchStore.getState();
    expect(state.userExists).toBe(true);
    expect(state.canonicalUsername).toBe('FakeUser0632');
    expect(state.viewedInstances).toEqual(instances);
    expect(useInstancesStore.getState().foreignInstances).toEqual(instances);
  });

  it('falls back to legacy ownership endpoint when canonical endpoint returns 404', async () => {
    const instances = {
      i2: { instance_id: 'i2', pokemon_id: 2, variant_id: '0002-default' },
    } as any;

    fetchMock
      .mockResolvedValueOnce(makeResponse(404))
      .mockResolvedValueOnce(makeResponse(200, { username: 'LegacyUser', instances }));

    const canonical = await useUserSearchStore
      .getState()
      .fetchUserInstancesByUsername('legacyuser');

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe(
      `${USERS_API_URL}/instances/by-username/legacyuser`,
    );
    expect(fetchMock.mock.calls[1][0]).toBe(
      `${USERS_API_URL}/ownershipData/username/legacyuser`,
    );
    expect(canonical).toBe('LegacyUser');
    expect(useUserSearchStore.getState().userExists).toBe(true);
    expect(useInstancesStore.getState().foreignInstances).toEqual(instances);
  });

  it('reuses cached foreign profile on 304 and keeps canonical casing', async () => {
    const instances = {
      i4: { instance_id: 'i4', pokemon_id: 4, variant_id: '0004-default' },
    } as any;

    fetchMock
      .mockResolvedValueOnce(
        makeResponse(200, { username: 'FakeUser0632', instances }, { ETag: 'etag-1' }),
      )
      .mockImplementationOnce(async (_url: string, init?: RequestInit) => {
        const headers = (init?.headers ?? {}) as Record<string, string>;
        expect(headers['If-None-Match']).toBe('etag-1');
        return makeResponse(304);
      });

    const first = await useUserSearchStore
      .getState()
      .fetchUserInstancesByUsername('fakeuser0632');
    const second = await useUserSearchStore
      .getState()
      .fetchUserInstancesByUsername('fakeuser0632');

    expect(first).toBe('FakeUser0632');
    expect(second).toBe('FakeUser0632');
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const state = useUserSearchStore.getState();
    expect(state.userExists).toBe(true);
    expect(state.canonicalUsername).toBe('FakeUser0632');
    expect(state.viewedInstances).toEqual(instances);
    expect(useInstancesStore.getState().foreignInstances).toEqual(instances);
  });

  it('clears stale foreign state when both endpoints return 404', async () => {
    const stale = {
      old: { instance_id: 'old', pokemon_id: 25, variant_id: '0025-default' },
    } as any;

    useInstancesStore.setState({ foreignInstances: stale });
    useUserSearchStore.setState({
      viewedInstances: stale,
      canonicalUsername: 'OldUser',
      userExists: true,
    });

    fetchMock
      .mockResolvedValueOnce(makeResponse(404))
      .mockResolvedValueOnce(makeResponse(404));

    await useUserSearchStore.getState().fetchUserInstancesByUsername('missinguser');

    const state = useUserSearchStore.getState();
    expect(state.userExists).toBe(false);
    expect(state.viewedInstances).toBeNull();
    expect(state.canonicalUsername).toBeNull();
    expect(useInstancesStore.getState().foreignInstances).toBeNull();
  });

  it('resetUserSearch clears store state and foreign instances', () => {
    const stale = {
      i3: { instance_id: 'i3', pokemon_id: 3, variant_id: '0003-default' },
    } as any;

    useInstancesStore.setState({ foreignInstances: stale });
    useUserSearchStore.setState({
      viewedInstances: stale,
      canonicalUsername: 'AnyUser',
      foreignInstancesLoading: true,
      userExists: true,
    });

    useUserSearchStore.getState().resetUserSearch();

    const state = useUserSearchStore.getState();
    expect(state.viewedInstances).toBeNull();
    expect(state.canonicalUsername).toBeNull();
    expect(state.foreignInstancesLoading).toBe(false);
    expect(state.userExists).toBeNull();
    expect(useInstancesStore.getState().foreignInstances).toBeNull();
  });
});
