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

import type { Instances, MutableInstances, InstanceStatus } from '@/types/instances';
import type { PokemonInstance } from '@/types/pokemonInstance';

type Patch = Partial<PokemonInstance>;
type PatchMap = Record<string, Patch>;

interface InstancesStore {
  instances: Instances;
  foreignInstances: Instances | null;
  instancesLoading: boolean;
  setForeignInstances(data: Instances): void;
  resetForeignInstances(): void;
  resetInstances(): void;
  hydrateInstances(data: Instances): void;
  setInstances(data: Instances): void;
  updateInstanceStatus(pokemonKeys: string | string[], newStatus: InstanceStatus): Promise<void>;
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
      console.log('[InstancesStore] resetInstances()');
      set({ instances: {}, instancesLoading: true });
      localStorage.removeItem('ownershipTimestamp');
    },

    hydrateInstances(data) {
      try {
        if (!data) {
          console.log('[InstancesStore] 💾 No data to hydrate');
          set({ instances: {}, instancesLoading: false });
          return;
        }
        const count = Object.keys(data).length;
        console.log(`[InstancesStore] 💾 Hydrated ${count} instance${count === 1 ? '' : 's'} from cache`);
        set({ instances: data, instancesLoading: false });
      } catch (error) {
        console.error('[InstancesStore] 🚨 Hydration failed:', error);
        set({ instances: {}, instancesLoading: false });
      }
    },

    setForeignInstances(data) {
      const count = Object.keys(data).length;
      console.log(`[InstancesStore] 🌍 Set foreignInstances with ${count} items`);
      set({ foreignInstances: data });
    },

    resetForeignInstances() {
      console.log('[InstancesStore] 🌍 Reset foreignInstances');
      set({ foreignInstances: null });
    },

    async setInstances(incoming) {
      if (!incoming || !Object.keys(incoming).length) {
        console.log('[InstancesStore] ⚠️ No incoming data – skipping set');
        return;
      }

      const current = get().instances;
      if (areInstancesEqual(current, incoming)) {
        console.log('[InstancesStore] 💤 No changes – incoming data matches current');
        return;
      }

      const username = useAuthStore.getState().user?.username ?? '';
      const merged = mergeInstancesData(current, incoming, username);

      const ts = Date.now();
      set({ instances: merged });
      console.log(`[InstancesStore] ✅ Updated instances – now tracking ${Object.keys(merged).length} Pokémon`);

      // Authoritative replace of cache snapshot to avoid drift
      try {
        await replaceInstancesData(merged, ts);
      } catch (e) {
        console.error('[InstancesStore] Failed to persist merged snapshot:', e);
      }
    },

    async updateInstanceStatus(pokemonKeys, newStatus) {
      console.log(`[InstancesStore] 🔄 Updating status for ${Array.isArray(pokemonKeys) ? pokemonKeys.length : 1} Pokémon to "${newStatus}"`);

      const fn = makeUpdateStatus(
        { get variants() { return useVariantsStore.getState().variants; } } as any,
        updater => {
          const res = updater({
            variants: useVariantsStore.getState().variants,
            instances: get().instances,
          });
          set({ instances: res.instances });
          if (Array.isArray(pokemonKeys)) {
            const after = res.instances;
            for (const k of pokemonKeys) {
              const row = after[k];
              if (row) {
                console.log('[DEBUG flags]', newStatus, k, {
                  caught  : row.is_caught,
                  trade   : row.is_for_trade,
                  wanted  : row.is_wanted,
                  missing : !row.registered,
                });
              }
            }
          }
          return res;
        },
        { current: get().instances }
      );

      await fn(pokemonKeys, newStatus);
      get().periodicUpdates();
    },

    async updateInstanceDetails(keyOrKeysOrMap, patch) {
      console.log('[InstancesStore] 🛠 Updating details for', keyOrKeysOrMap);

      const fn = makeUpdateDetails(
        { instances: get().instances },
        updater => {
          const res = updater({ instances: get().instances });
          set(produce((state: any) => {
            state.instances = res.instances;
          }));
          return res;
        }
      );

      await fn(keyOrKeysOrMap as any, patch as any);
      get().periodicUpdates();
    },

    periodicUpdates,
  };
});
