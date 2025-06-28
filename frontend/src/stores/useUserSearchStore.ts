// stores/useUserSearchStore.ts

import { create } from 'zustand';
import { openDB } from 'idb';

import type { Instances } from '@/types/instances';
import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { useTagsStore } from '@/features/tags/store/useTagsStore';

const USERS_API_URL = import.meta.env.VITE_USERS_API_URL;
const CACHE_NAME = 'SearchCache';

function replaceAddressBar(oldName: string, newName: string) {
   if (oldName !== newName) {
     const url = window.location.pathname.replace(oldName, newName);
     window.history.replaceState({}, '', url);
   }
  }

interface UserSearchStore {
  viewedOwnershipData: Instances | null;
  canonicalUsername: string | null;
  foreignInstancesLoading: boolean;
  userExists: boolean | null;
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
  viewedOwnershipData: null,
  canonicalUsername: null,
  foreignInstancesLoading: false,
  userExists: null,

  async fetchUserOwnershipData(
    searchedUsername,
    setOwnershipFilter,
    defaultFilter = 'Owned',
    alertFn
  ) {
    console.log('[UserSearchStore] fetchUserOwnershipData →', searchedUsername);
    set({ foreignInstancesLoading: true, userExists: null });

    try {
      const lower = searchedUsername.toLowerCase();
      const db = await openDB(CACHE_NAME, 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(CACHE_NAME)) {
            db.createObjectStore(CACHE_NAME, { keyPath: 'username' });
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

      const cached = canonicalKey ? await db.get(CACHE_NAME, canonicalKey) : null;
      const cachedEtag = cached?.etag || null;

      const resp = await fetch(`${USERS_API_URL}/ownershipData/username/${lower}`, {
        credentials: 'include',
        headers: cachedEtag ? { 'If-None-Match': cachedEtag } : {},
      });

      if (resp.status === 304 && cached) {
        console.log('[UserSearchStore] 304 – using cached data');
        set({
          viewedOwnershipData: cached.ownershipData,
          canonicalUsername: cached.username,
          userExists: true,
        });
        setOwnershipFilter?.(defaultFilter);
        return cached.username;
      }

      if (resp.ok) {
        const result = await resp.json();
        const actualUsername = result.username || searchedUsername;

        replaceAddressBar(searchedUsername, actualUsername);

        useInstancesStore.getState().setForeignInstances(result.instances);

        set({
            viewedOwnershipData: result.instances,
            canonicalUsername: actualUsername,
            userExists: true,
        });

        await db.put(CACHE_NAME, {
          username: actualUsername,
          ownershipData: result.instances,
          timestamp: Date.now(),
          etag: resp.headers.get('ETag') || null,
        });

        setOwnershipFilter?.(defaultFilter);
        return actualUsername;
      }

      if (resp.status === 404) {
        console.warn('[UserSearchStore] 404 – user not found');
        set({ userExists: false });
      } else if (resp.status === 403) {
        if (alertFn) await alertFn('You must be logged in to perform this search.');
      } else {
        console.error('[UserSearchStore] fetch failed:', resp.statusText);
      }

      set({ viewedOwnershipData: null, canonicalUsername: null });
    } catch (err) {
      console.error('[UserSearchStore] fetch error:', err);
      set({ viewedOwnershipData: null, canonicalUsername: null });
    } finally {
      set({ foreignInstancesLoading: false });
    }
  },

  loadForeignProfile(username, resetTagFilter) {
    const { fetchUserOwnershipData } = get();
    // Always default to the “Owned” list after loading a foreign profile
    return fetchUserOwnershipData(username, resetTagFilter, 'Owned');
  },

  resetUserSearch() {
    set({
      viewedOwnershipData: null,
      canonicalUsername: null,
      foreignInstancesLoading: false,
      userExists: null,
    });
    useTagsStore.getState().buildForeignTags({});
  },
}));
