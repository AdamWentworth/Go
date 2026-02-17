// src/features/instances/store/useInstancesStore.ts

import { create } from 'zustand';
import { produce } from 'immer';
import { periodicUpdates as periodicFactory } from '@/stores/BatchedUpdates/periodicUpdates';
import { mergeInstancesData } from '@/features/instances/utils/mergeInstancesData';
import { updateInstanceStatus as makeUpdateStatus } from '@/features/instances/actions/updateInstanceStatus';
import { updateInstanceDetails as makeUpdateDetails } from '@/features/instances/actions/updateInstanceDetails';
import { useAuthStore } from '@/stores/useAuthStore';
import { useVariantsStore } from '@/features/variants/store/useVariantsStore';
import { replaceInstancesData } from '@/features/instances/storage/instancesStorage';
import { areInstancesEqual } from '@/features/instances/utils/instancesEquality';
import { createScopedLogger } from '@/utils/logger';

import type { Instances, InstanceStatus } from '@/types/instances';
import type { PokemonInstance } from '@/types/pokemonInstance';

type Patch = Partial<PokemonInstance>;
type PatchMap = Record<string, Patch>;
const log = createScopedLogger('InstancesStore');

interface InstancesStore {
  instances: Instances;
  foreignInstances: Instances | null;
  instancesLoading: boolean;
  setForeignInstances(data: Instances): void;
  resetForeignInstances(): void;
  resetInstances(): void;
  hydrateInstances(data: Instances): void;
  setInstances(data: Instances): void;
  updateInstanceStatus(instanceIds: string | string[], newStatus: InstanceStatus): Promise<void>;
  updateInstanceDetails(keyOrKeysOrMap: string | string[] | PatchMap, patch?: Patch): Promise<void>;
  periodicUpdates(): void;
}

export const useInstancesStore = create<InstancesStore>()((set, get) => {
  const scheduledRef = { current: null as any };
  const timerRef = { current: null as NodeJS.Timeout | null };
  const periodicUpdates = periodicFactory(scheduledRef, timerRef);

  return {
    instances: {},
    foreignInstances: null,
    instancesLoading: true,

    resetInstances() {
      log.debug('resetInstances()');
      set({ instances: {}, instancesLoading: true });
      localStorage.removeItem('ownershipTimestamp');
    },

    hydrateInstances(data) {
      try {
        if (!data) {
          log.debug('No data to hydrate');
          set({ instances: {}, instancesLoading: false });
          return;
        }
        const count = Object.keys(data).length;
        log.debug(`Hydrated ${count} instance${count === 1 ? '' : 's'} from cache`);
        set({ instances: data, instancesLoading: false });
      } catch (error) {
        log.error('Hydration failed', error);
        set({ instances: {}, instancesLoading: false });
      }
    },

    setForeignInstances(data) {
      const count = Object.keys(data).length;
      log.debug(`Set foreignInstances with ${count} items`);
      set({ foreignInstances: data });
    },

    resetForeignInstances() {
      log.debug('Reset foreignInstances');
      set({ foreignInstances: null });
    },

    async setInstances(incoming) {
      if (!incoming || !Object.keys(incoming).length) {
        log.debug('No incoming data; skipping set');
        return;
      }

      const current = get().instances;
      if (areInstancesEqual(current, incoming)) {
        log.debug('No changes; incoming data matches current');
        return;
      }

      const username = useAuthStore.getState().user?.username ?? '';
      const merged = mergeInstancesData(current, incoming, username);

      const ts = Date.now();
      set({ instances: merged });
      log.debug(`Updated instances; now tracking ${Object.keys(merged).length} records`);

      // Authoritative replace of cache snapshot to avoid drift.
      try {
        await replaceInstancesData(merged, ts);
      } catch (error) {
        log.warn('Failed to persist merged snapshot', error);
      }
    },

    async updateInstanceStatus(instanceIds, newStatus) {
      log.debug(
        `Updating status for ${Array.isArray(instanceIds) ? instanceIds.length : 1} records to "${newStatus}"`,
      );

      const fn = makeUpdateStatus(
        { get variants() { return useVariantsStore.getState().variants; } } as any,
        updater => {
          const res = updater({
            variants: useVariantsStore.getState().variants,
            instances: get().instances,
          });
          set({ instances: res.instances });
          if (Array.isArray(instanceIds)) {
            const after = res.instances;
            for (const key of instanceIds) {
              const row = after[key];
              if (row) {
                log.debug('Post-status flags', newStatus, key, {
                  caught: row.is_caught,
                  trade: row.is_for_trade,
                  wanted: row.is_wanted,
                  missing: !row.registered,
                });
              }
            }
          }
          return res;
        },
        { current: get().instances },
      );

      await fn(instanceIds, newStatus);
      get().periodicUpdates();
    },

    async updateInstanceDetails(keyOrKeysOrMap, patch) {
      log.debug('Updating details for', keyOrKeysOrMap);

      const fn = makeUpdateDetails(
        { instances: get().instances },
        updater => {
          const res = updater({ instances: get().instances });
          set(
            produce((state: any) => {
              state.instances = res.instances;
            }),
          );
          return res;
        },
      );

      await fn(keyOrKeysOrMap as any, patch as any);
      get().periodicUpdates();
    },

    periodicUpdates,
  };
});
