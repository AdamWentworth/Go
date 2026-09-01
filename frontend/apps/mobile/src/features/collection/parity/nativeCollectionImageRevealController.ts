import { useCallback, useSyncExternalStore } from 'react';

export type NativeCollectionImageRevealController = {
  isEnabled: (index: number) => boolean;
  setRevealCount: (count: number | null) => void;
  subscribe: (index: number, listener: () => void) => () => void;
};

const isEnabledAtCount = (count: number | null, index: number): boolean => (
  count === null || index < count
);

/**
 * React Native's legacy Android Image view can decode on the render thread.
 * Reveal destination images progressively without putting a changing counter
 * in FlatList's props: each subscribed card is notified only when its own
 * enabled value changes. This mirrors the independent lazy-image lifecycle in
 * Vite and avoids reconciling the complete visible list once per image.
 */
export const createNativeCollectionImageRevealController = (
  initialRevealCount: number | null = null,
): NativeCollectionImageRevealController => {
  let revealCount = initialRevealCount;
  const listenersByIndex = new Map<number, Set<() => void>>();

  return {
    isEnabled(index) {
      return isEnabledAtCount(revealCount, index);
    },
    setRevealCount(nextCount) {
      if (nextCount === revealCount) return;
      const previousCount = revealCount;
      revealCount = nextCount;
      listenersByIndex.forEach((listeners, index) => {
        if (
          isEnabledAtCount(previousCount, index)
          === isEnabledAtCount(nextCount, index)
        ) return;
        listeners.forEach((listener) => listener());
      });
    },
    subscribe(index, listener) {
      let listeners = listenersByIndex.get(index);
      if (!listeners) {
        listeners = new Set();
        listenersByIndex.set(index, listeners);
      }
      listeners.add(listener);
      return () => {
        listeners?.delete(listener);
        if (listeners?.size === 0) listenersByIndex.delete(index);
      };
    },
  };
};

export const useNativeCollectionImageReveal = ({
  controller,
  fallbackEnabled = true,
  index,
}: {
  controller?: NativeCollectionImageRevealController;
  fallbackEnabled?: boolean;
  index: number;
}): boolean => {
  const subscribe = useCallback(
    (listener: () => void) => controller?.subscribe(index, listener) ?? (() => undefined),
    [controller, index],
  );
  const getSnapshot = useCallback(
    () => controller?.isEnabled(index) ?? fallbackEnabled,
    [controller, fallbackEnabled, index],
  );
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};
