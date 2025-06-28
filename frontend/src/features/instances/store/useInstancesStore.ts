// store/useInstancesStore.ts

import { create } from 'zustand';
import { produce } from 'immer'; // Add Immer import
import { periodicUpdates as periodicFactory } from '@/stores/BatchedUpdates/periodicUpdates';
import { mergeInstancesData } from '@/features/instances/utils/mergeInstancesData';
import { updateInstanceStatus as makeUpdateStatus } from '@/features/instances/actions/updateInstanceStatus';
import { updateInstanceDetails as makeUpdateDetails } from '@/features/instances/actions/updateInstanceDetails';
import { useAuthStore } from '@/stores/useAuthStore';
import { useVariantsStore } from '@/features/variants/store/useVariantsStore';
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
        set({ instances: {}, instancesLoading: false }); // Changed from true to false to ensure loading state clears even on error
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

    setInstances(incoming) {
      if (!incoming || !Object.keys(incoming).length) {
        console.log('[InstancesStore] ⚠️ No incoming data – skipping set');
        return;
      }
    
      const current = get().instances;
      if (JSON.stringify(current) === JSON.stringify(incoming)) {
        console.log('[InstancesStore] 💤 No changes – incoming data matches current');
        return;
      }
    
      const username = useAuthStore.getState().user?.username ?? '';
      const merged = mergeInstancesData(current, incoming, username);
    
      // Make sure timestamp is set before state update
      const timestamp = Date.now().toString();
      localStorage.setItem('ownershipTimestamp', timestamp);
      
      set({ instances: merged });
      console.log(`[InstancesStore] ✅ Updated instances – now tracking ${Object.keys(merged).length} Pokémon`);
    
      // Fixed template string (changed [] to backticks)
      navigator.serviceWorker.ready
        .then(r =>
          r.active?.postMessage({
            action: 'syncData',
            data: { data: merged, timestamp: Date.now() },
          })
        )
        .catch(console.error);
    },

    async updateInstanceStatus(pokemonKeys, newStatus) {
      console.log(`[InstancesStore] 🔄 Updating status for ${pokemonKeys.length} Pokémon to "${newStatus}"`);

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
              if (k.includes('0583-shiny') || k.includes('0584-shiny')) {
                console.log('[DEBUG inst]', newStatus, k, after[k]);
              }
            }
          }
          if (Array.isArray(pokemonKeys)) {
            const after = res.instances;
            for (const k of pokemonKeys) {
              if (k.includes('0583-shiny') || k.includes('0584-shiny')) {
                const row = after[k];
                if (row) {
                  console.log('[DEBUG flags]', newStatus, k, {
                    owned  : row.is_owned,
                    trade  : row.is_for_trade,
                    wanted : row.is_wanted,
                    unowned: row.is_unowned,
                  });
                }
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
        { instances: get().instances }, // Pass current instances directly
        updater => {
          const res = updater({ instances: get().instances });
          // Use Immer to update state immutably
          set(
            produce(state => {
              state.instances = res.instances;
            })
          );
          return res;
        }
      );

      await fn(keyOrKeysOrMap as any, patch as any);
      get().periodicUpdates();
    },

    periodicUpdates,
  };
});