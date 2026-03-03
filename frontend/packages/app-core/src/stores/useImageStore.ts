// useImageStore.ts

import { create } from 'zustand';

type ImageStatus = 'loading' | 'loaded' | 'error';

type ImageCacheStore = {
  imageMap: Map<string, string>; // imageURL by key
  statusMap: Map<string, ImageStatus>;
  preload: (key: string, url: string) => void;
  getStatus: (key: string) => ImageStatus | undefined;
  getUrl: (key: string) => string | undefined;
};

export const useImageStore = create<ImageCacheStore>((set, get) => ({
  imageMap: new Map(),
  statusMap: new Map(),

  preload: (key, url) => {
    if (get().statusMap.get(key) === 'loaded') return;

    const imageMap = new Map(get().imageMap);
    const statusMap = new Map(get().statusMap);

    statusMap.set(key, 'loading');
    set({ imageMap, statusMap });

    const img = new Image();
    img.onload = () => {
      imageMap.set(key, url);
      statusMap.set(key, 'loaded');
      set({ imageMap, statusMap });
    };
    img.onerror = () => {
      statusMap.set(key, 'error');
      set({ statusMap });
    };
    img.src = url;
  },

  getStatus: (key) => get().statusMap.get(key),
  getUrl: (key) => get().imageMap.get(key),
}));
