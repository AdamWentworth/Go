import { create } from 'zustand';
import { openDB } from 'idb';

import type { Instances } from '@/types/instances';
import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { useTagsStore } from '@/features/tags/store/useTagsStore';

const USERS_API_URL = import.meta.env.VITE_USERS_API_URL;
const CACHE_NAME = 'SearchCache';

type SearchCacheRecord = {
  username: string;
  instances?: Instances;
  ownershipData?: Instances; // legacy cache field
  timestamp: number;
  etag: string | null;
};

function replaceAddressBar(oldName: string, newName: string) {
  if (oldName !== newName) {
    const url = window.location.pathname.replace(oldName, newName);
    window.history.replaceState({}, '', url);
  }
}

function getCachedInstances(record: SearchCacheRecord | null): Instances | null {
  if (!record) return null;
  return record.instances ?? record.ownershipData ?? null;
}

interface UserSearchStore {
  viewedInstances: Instances | null;
  viewedOwnershipData: Instances | null; // legacy alias
  canonicalUsername: string | null;
  foreignInstancesLoading: boolean;
  userExists: boolean | null;
  fetchUserInstancesByUsername: (
    searchedUsername: string,
    setOwnershipFilter?: (tag: string) => void,
    defaultFilter?: string,
    alertFn?: (msg: string) => Promise<void>
  ) => Promise<string | void>;
  fetchUserOwnershipData: (
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
  viewedOwnershipData: null,
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

      let canonicalKey: string | null = null;
      for (const key of await db.getAllKeys(CACHE_NAME)) {
        if (typeof key === 'string' && key.toLowerCase() === lower) {
          canonicalKey = key;
          break;
        }
      }

      const cached = canonicalKey
        ? ((await db.get(CACHE_NAME, canonicalKey)) as SearchCacheRecord | null)
        : null;
      const cachedInstances = getCachedInstances(cached);
      const cachedEtag = cached?.etag ?? null;

      const headers = cachedEtag ? { 'If-None-Match': cachedEtag } : {};
      let resp = await fetch(`${USERS_API_URL}/instances/by-username/${lower}`, {
        credentials: 'include',
        headers,
      });

      // Backward compatibility while older backend versions are still deployed.
      if (resp.status === 404) {
        resp = await fetch(`${USERS_API_URL}/ownershipData/username/${lower}`, {
          credentials: 'include',
          headers,
        });
      }

      if (resp.status === 304 && cached && cachedInstances) {
        console.log('[UserSearchStore] 304 - using cached data');
        useInstancesStore.getState().setForeignInstances(cachedInstances);
        set({
          viewedInstances: cachedInstances,
          viewedOwnershipData: cachedInstances,
          canonicalUsername: cached.username,
          userExists: true,
        });
        setOwnershipFilter?.(defaultFilter);
        return cached.username;
      }

      if (resp.ok) {
        const result = await resp.json();
        const actualUsername = result.username || searchedUsername;
        const instances: Instances = result.instances ?? {};

        replaceAddressBar(searchedUsername, actualUsername);
        useInstancesStore.getState().setForeignInstances(instances);

        set({
          viewedInstances: instances,
          viewedOwnershipData: instances,
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

      set({
        viewedInstances: null,
        viewedOwnershipData: null,
        canonicalUsername: null,
      });
    } catch (err) {
      console.error('[UserSearchStore] fetch error:', err);
      set({
        viewedInstances: null,
        viewedOwnershipData: null,
        canonicalUsername: null,
      });
    } finally {
      set({ foreignInstancesLoading: false });
    }
  },

  // Legacy alias for older call sites.
  fetchUserOwnershipData(searchedUsername, setOwnershipFilter, defaultFilter = 'Caught', alertFn) {
    return get().fetchUserInstancesByUsername(
      searchedUsername,
      setOwnershipFilter,
      defaultFilter,
      alertFn
    );
  },

  loadForeignProfile(username, resetTagFilter) {
    const { fetchUserInstancesByUsername } = get();
    return fetchUserInstancesByUsername(username, resetTagFilter, 'Caught');
  },

  resetUserSearch() {
    set({
      viewedInstances: null,
      viewedOwnershipData: null,
      canonicalUsername: null,
      foreignInstancesLoading: false,
      userExists: null,
    });
    useTagsStore.getState().buildForeignTags({});
  },
}));
