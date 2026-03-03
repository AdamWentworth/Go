// src/stores/useCacheStore.ts

import { create } from 'zustand';

type CacheStore = {
  cache: Map<string, string | undefined>;
  set: (key: string, value: string) => void;
  get: (key: string) => string | undefined;
  clear: () => void;
};

export const useCacheStore = create<CacheStore>((set, get) => ({
  cache: new Map(),

  set: (key, value) => {
    const updated = new Map(get().cache);
    updated.set(key, value);
    set({ cache: updated });
  },

  get: (key) => get().cache.get(key),

  clear: () => {
    set({ cache: new Map() });
  },
}));
