// useLocationStore.ts

import { create } from 'zustand';

/* -------------------------------------------------------------------------- */
/*  TYPES                                                                     */
/* -------------------------------------------------------------------------- */
export type Coordinates = { latitude: number; longitude: number } | null;
export type LocationStatus = 'checking' | 'available' | 'unavailable';

interface LocationState {
  location: Coordinates;
  status: LocationStatus;
  /** internal helper when we need to reset state in tests */
  _setAll: (loc: Coordinates, status: LocationStatus) => void;
  setLocation: (loc: Coordinates) => void;
  setStatus: (s: LocationStatus) => void;
}

/* -------------------------------------------------------------------------- */
/*  STORE                                                                     */
/* -------------------------------------------------------------------------- */
export const useLocationStore = create<LocationState>((set) => ({
  location: null,
  status: 'checking',

  _setAll: (loc, status) => set({ location: loc, status }),
  setLocation: (loc) => set({ location: loc }),
  setStatus: (status) => set({ status }),
}));