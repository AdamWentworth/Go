import { create } from 'zustand';

import {
  deleteManualPokedexRegistrations,
  getManualPokedexRegistrations,
  putManualPokedexRegistrations,
} from '@/db/registrationsDB';
import { createScopedLogger } from '@/utils/logger';

import type { PokedexRegistrationEntry } from '@/features/pokedex/registrationProjection';

const log = createScopedLogger('ManualPokedexRegistrationsStore');

interface ManualPokedexRegistrationsState {
  registrations: PokedexRegistrationEntry[];
  registrationsLoading: boolean;
  hydrate(): Promise<void>;
  register(entries: PokedexRegistrationEntry[]): Promise<void>;
  unregister(registrationIds: string[]): Promise<void>;
  reset(): void;
}

function uniqueEntries(entries: PokedexRegistrationEntry[]): PokedexRegistrationEntry[] {
  return Array.from(new Map(entries.map((entry) => [entry.registration_id, entry])).values());
}

export const useManualPokedexRegistrationsStore = create<ManualPokedexRegistrationsState>(
  (set) => ({
    registrations: [],
    registrationsLoading: true,

    async hydrate() {
      set({ registrationsLoading: true });
      try {
        const registrations = await getManualPokedexRegistrations();
        set({ registrations: uniqueEntries(registrations), registrationsLoading: false });
      } catch (error) {
        log.warn('Failed to hydrate manual registrations', error);
        set({ registrations: [], registrationsLoading: false });
      }
    },

    async register(entries) {
      const nextEntries = uniqueEntries(entries);
      if (nextEntries.length === 0) return;

      await putManualPokedexRegistrations(nextEntries);
      set((current) => ({
        registrations: uniqueEntries([...current.registrations, ...nextEntries]),
        registrationsLoading: false,
      }));
    },

    async unregister(registrationIds) {
      const ids = Array.from(new Set(registrationIds));
      if (ids.length === 0) return;

      await deleteManualPokedexRegistrations(ids);
      const removedIds = new Set(ids);
      set((current) => ({
        registrations: current.registrations.filter(
          (entry) => !removedIds.has(entry.registration_id),
        ),
        registrationsLoading: false,
      }));
    },

    reset() {
      set({ registrations: [], registrationsLoading: true });
    },
  }),
);
