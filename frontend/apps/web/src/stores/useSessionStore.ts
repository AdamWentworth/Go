// useSessionStore.ts

import { create } from 'zustand';
import { createScopedLogger } from '@/utils/logger';
import {
  getStorageNumber,
  setStorageNumber,
  STORAGE_KEYS,
} from '@/utils/storage';

const log = createScopedLogger('useSessionStore');

type SessionStore = {
  lastUpdateTimestamp: Date | null;
  isSessionNew: boolean;
  initSession: () => void;
  updateTimestamp: (timestamp: Date) => void;
};

const INACTIVITY_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

export const useSessionStore = create<SessionStore>((set) => ({
  lastUpdateTimestamp: null,
  isSessionNew: false,

  initSession: () => {
    const currentTime = new Date().getTime();
    const lastActivity = getStorageNumber(STORAGE_KEYS.lastActivityTime, NaN);
    const hasLastActivity = Number.isFinite(lastActivity);

    const isSessionNew =
      !hasLastActivity
        ? true
        : currentTime - lastActivity > INACTIVITY_THRESHOLD_MS;

    setStorageNumber(STORAGE_KEYS.lastActivityTime, currentTime);

    const ownershipTimestamp = getStorageNumber(
      STORAGE_KEYS.ownershipTimestamp,
      Date.now(),
    );
    const lastUpdateTimestamp = new Date(ownershipTimestamp);

    set({ lastUpdateTimestamp, isSessionNew });
  },

  updateTimestamp: (timestamp: Date) => {
    log.debug('Updating lastUpdateTimestamp to:', timestamp);
    set({
      lastUpdateTimestamp: timestamp,
      isSessionNew: false,
    });
  },
}));
