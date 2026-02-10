import { create } from 'zustand';
import { openDB } from 'idb';

import type { Instances } from '@/types/instances';
import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { useTagsStore } from '@/features/tags/store/useTagsStore';

const USERS_API_URL = import.meta.env.VITE_USERS_API_URL;
const CACHE_NAME = 'SearchCache';

type SearchCacheRecord = {
  username: string;
  instances: Instances;
  timestamp: number;
  etag: string | null;
};

function replaceAddressBar(oldName: string, newName: string) {
	if (oldName !== newName) {
		const path = window.location.pathname;
		const segments = path.split('/');
		const last = segments[segments.length - 1];
		if (last && last.toLowerCase() === oldName.toLowerCase()) {
			segments[segments.length - 1] = newName;
			const nextPath = segments.join('/');
			window.history.replaceState(
				{},
				'',
				`${nextPath}${window.location.search}${window.location.hash}`
			);
		}
	}
}

function getCachedInstances(record: SearchCacheRecord | null): Instances | null {
  if (!record) return null;
  return record.instances ?? null;
}

interface UserSearchStore {
  viewedInstances: Instances | null;
  canonicalUsername: string | null;
  foreignInstancesLoading: boolean;
  userExists: boolean | null;
  fetchUserInstancesByUsername: (
    searchedUsername: string,
    setOwnershipFilter?: (tag: string) => void,
    defaultFilter?: string,
    alertFn?: (msg: string) => Promise<void>
  ) => Promise<string | void>;
  loadForeignProfile: (
    username: string,
    resetTagFilter: () => void
  ) => Promise<string | void>;
  resetUserSearch: () => void;
}

export const useUserSearchStore = create<UserSearchStore>((set, get) => ({
  viewedInstances: null,
  canonicalUsername: null,
  foreignInstancesLoading: false,
  userExists: null,

  async fetchUserInstancesByUsername(
    searchedUsername,
    setOwnershipFilter,
    defaultFilter = 'Caught',
    alertFn
  ) {
    console.log('[UserSearchStore] fetchUserInstancesByUsername ->', searchedUsername);
    set({ foreignInstancesLoading: true, userExists: null });

    try {
      const lower = searchedUsername.toLowerCase();
      const db = await openDB(CACHE_NAME, 1, {
        upgrade(upgradeDB) {
          if (!upgradeDB.objectStoreNames.contains(CACHE_NAME)) {
            upgradeDB.createObjectStore(CACHE_NAME, { keyPath: 'username' });
          }
        },
      });

      // Fast-path common lookups before a full key scan.
      const exactCached = (await db.get(CACHE_NAME, searchedUsername)) as SearchCacheRecord | null;
      const lowerCached =
        searchedUsername === lower
          ? exactCached
          : ((await db.get(CACHE_NAME, lower)) as SearchCacheRecord | null);

      let cached = exactCached ?? lowerCached ?? null;
      let canonicalKey: string | null = cached?.username ?? null;

      if (!cached) {
        for (const key of await db.getAllKeys(CACHE_NAME)) {
          if (typeof key === 'string' && key.toLowerCase() === lower) {
            canonicalKey = key;
            cached = (await db.get(CACHE_NAME, canonicalKey)) as SearchCacheRecord | null;
            break;
          }
        }
      }

      const cachedInstances = getCachedInstances(cached);
      const cachedEtag = cached?.etag ?? null;

      const headers = cachedEtag ? { 'If-None-Match': cachedEtag } : {};
      let resp = await fetch(`${USERS_API_URL}/instances/by-username/${lower}`, {
        credentials: 'include',
        headers,
      });

      // Resilience fallback: if instance endpoint returns 403/404, try public snapshot.
      if (resp.status === 403 || resp.status === 404) {
        const publicResp = await fetch(`${USERS_API_URL}/public/users/${lower}`, {
          credentials: 'include',
          headers,
        });
        if (publicResp.ok || publicResp.status === 304 || publicResp.status === 404) {
          resp = publicResp;
        }
      }

      if (resp.status === 304 && cached && cachedInstances) {
        console.log('[UserSearchStore] 304 - using cached data');
        useInstancesStore.getState().setForeignInstances(cachedInstances);
        set({
          viewedInstances: cachedInstances,
          canonicalUsername: cached.username,
          userExists: true,
        });
        setOwnershipFilter?.(defaultFilter);
        return cached.username;
      }

      if (resp.ok) {
        const result = await resp.json();
        const actualUsername = result.username || result.user?.username || searchedUsername;
        const instances: Instances = result.instances ?? {};

        replaceAddressBar(searchedUsername, actualUsername);
        useInstancesStore.getState().setForeignInstances(instances);

        set({
          viewedInstances: instances,
          canonicalUsername: actualUsername,
          userExists: true,
        });

        await db.put(CACHE_NAME, {
          username: actualUsername,
          instances,
          timestamp: Date.now(),
          etag: resp.headers.get('ETag') ?? null,
        } as SearchCacheRecord);

        setOwnershipFilter?.(defaultFilter);
        return actualUsername;
      }

      if (resp.status === 404) {
        console.warn('[UserSearchStore] 404 - user not found');
        set({ userExists: false });
      } else if (resp.status === 403) {
        if (alertFn) await alertFn('You must be logged in to perform this search.');
      } else {
        console.error('[UserSearchStore] fetch failed:', resp.status, resp.statusText);
      }

      // Avoid leaking stale foreign profile data after failed lookups.
      useInstancesStore.getState().resetForeignInstances();
      set({
        viewedInstances: null,
        canonicalUsername: null,
      });
    } catch (err) {
      console.error('[UserSearchStore] fetch error:', err);
      useInstancesStore.getState().resetForeignInstances();
      set({
        viewedInstances: null,
        canonicalUsername: null,
      });
    } finally {
      set({ foreignInstancesLoading: false });
    }
  },

  loadForeignProfile(username, resetTagFilter) {
    const { fetchUserInstancesByUsername } = get();
    return fetchUserInstancesByUsername(username, resetTagFilter, 'Caught');
  },

  resetUserSearch() {
    useInstancesStore.getState().resetForeignInstances();
    set({
      viewedInstances: null,
      canonicalUsername: null,
      foreignInstancesLoading: false,
      userExists: null,
    });
    useTagsStore.getState().buildForeignTags({});
  },
}));
