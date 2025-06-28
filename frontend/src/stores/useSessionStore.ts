// useSessionStore.ts

import { create } from 'zustand';

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
    const lastActivityStr = localStorage.getItem('lastActivityTime');
    const lastActivity = lastActivityStr ? parseInt(lastActivityStr, 10) : null;

    const isSessionNew =
      lastActivity === null
        ? true
        : currentTime - lastActivity > INACTIVITY_THRESHOLD_MS;

    localStorage.setItem('lastActivityTime', currentTime.toString());

    const ownershipTimestampStr = localStorage.getItem('ownershipTimestamp');
    const lastUpdateTimestamp = ownershipTimestampStr
      ? new Date(parseInt(ownershipTimestampStr, 10))
      : new Date();

    set({ lastUpdateTimestamp, isSessionNew });
  },

  updateTimestamp: (timestamp: Date) => {
    console.log('Updating lastUpdateTimestamp to:', timestamp);
    set({
      lastUpdateTimestamp: timestamp,
      isSessionNew: false,
    });
  },
}));
