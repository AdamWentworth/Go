// useTagsStore.ts

import { create } from 'zustand';

import {
  // normalized custom tags
  getAllTagDefs,
  getInstanceTagsForUser,
  persistSystemMembershipsFromBuckets,
  // lean ids snapshot
  getSystemChildrenSnapshot,
  setSystemChildrenSnapshot,
  type SystemChildrenIdsSnapshot,
} from '@/db/tagsDB';

import { getAllVariants }  from '@/db/variantsDB';
import { getAllInstances } from '@/db/instancesDB';

import { initializePokemonTags } from '../utils/initializePokemonTags';
import { isDataFresh }          from '@/utils/cacheHelpers';

import { useVariantsStore }  from '@/features/variants/store/useVariantsStore';
import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { useAuthStore }      from '@/stores/useAuthStore';

import type { TagBuckets, TagItem } from '@/types/tags';
import type { Instances }           from '@/types/instances';
import type { PokemonVariant }      from '@/types/pokemonVariants';

const PERSIST_SYSTEM_MEMBERSHIPS = true;

/* ------------ Types for custom tag tree ------------ */

export type ParentKind = 'caught' | 'trade' | 'wanted';

export interface TagDef {
  tag_id: string;
  user_id: string;
  parent: ParentKind;
  name: string;
  color?: string | null;
  sort?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
}

export interface CustomTagBucket {
  tag: TagDef;
  items: Record<string, TagItem>;
}

export interface CustomTagsTree {
  caught: Record<string, CustomTagBucket>;
  trade : Record<string, CustomTagBucket>;
  wanted: Record<string, CustomTagBucket>;
}

/* ------------ System children (computed) ------------ */

export interface SystemChildren {
  caught: { favorite: Record<string, TagItem>; trade: Record<string, TagItem>; };
  wanted: { mostWanted: Record<string, TagItem>; };
}

const EMPTY_BUCKETS: TagBuckets = { caught: {}, wanted: {}, trade: {} };
const EMPTY_CUSTOM  : CustomTagsTree = { caught: {}, trade: {}, wanted: {} };

function computeSystemChildren(tags: TagBuckets): SystemChildren {
  const favorite: Record<string, TagItem>   = {};
  const trade   : Record<string, TagItem>   = {};
  const mostWanted: Record<string, TagItem> = {};

  for (const [id, item] of Object.entries(tags.caught)) {
    if ((item as any).favorite) favorite[id] = item;
    if ((item as any).is_for_trade) trade[id] = item;
  }
  for (const [id, item] of Object.entries(tags.trade)) trade[id] = item;
  for (const [id, item] of Object.entries(tags.wanted)) {
    if ((item as any).most_wanted) mostWanted[id] = item;
  }

  return { caught: { favorite, trade }, wanted: { mostWanted } };
}

function toSnapshotIds(sys: SystemChildren): SystemChildrenIdsSnapshot {
  return {
    caught_favorite_ids: Object.keys(sys.caught.favorite),
    caught_trade_ids:    Object.keys(sys.caught.trade),
    wanted_mostWanted_ids: Object.keys(sys.wanted.mostWanted),
    version: 2,
  };
}

function idsToChildren(snap: SystemChildrenIdsSnapshot, buckets: TagBuckets): SystemChildren {
  const pick = (ids: string[], src: Record<string, TagItem>) => {
    const out: Record<string, TagItem> = {};
    for (const id of ids) if (src[id]) out[id] = src[id];
    return out;
  };
  const child = {
    caught: {
      favorite: pick(snap.caught_favorite_ids, buckets.caught),
      trade:    pick(snap.caught_trade_ids,    buckets.caught),
    },
    wanted: {
      mostWanted: pick(snap.wanted_mostWanted_ids, buckets.wanted),
    },
  };
  // union explicit trade bucket
  for (const [id, item] of Object.entries(buckets.trade)) child.caught.trade[id] = item;
  return child;
}

/* ------------ Store ------------ */

interface TagsStore {
  tags             : TagBuckets;
  customTags       : CustomTagsTree;
  systemChildren   : SystemChildren;
  tagsLoading      : boolean;
  customTagsLoading: boolean;
  foreignTags      : TagBuckets | null;

  buildTags       (): Promise<void>;
  refreshTags     (): Promise<void>;
  resetTags       : () => void;
  hydrateFromCache: () => Promise<void>;
  buildForeignTags(instances: Instances): void;

  rebuildCustomTags(userId?: string): Promise<void>;
}

export const useTagsStore = create<TagsStore>()((set, get) => ({
  tags             : { ...EMPTY_BUCKETS },
  customTags       : { ...EMPTY_CUSTOM },
  systemChildren   : computeSystemChildren(EMPTY_BUCKETS),
  tagsLoading      : true,
  customTagsLoading: true,
  foreignTags      : null,

  async rebuildCustomTags(userId) {
    const { variants, variantsLoading }   = useVariantsStore.getState();
    const { instances, instancesLoading } = useInstancesStore.getState();
    if (variantsLoading || instancesLoading) return;

    const uid = userId ?? (useAuthStore.getState().user?.user_id ?? '');
    if (!uid) { set({ customTags: { ...EMPTY_CUSTOM }, customTagsLoading: false }); return; }

    set({ customTagsLoading: true });

    try {
      const [defs, memberships] = await Promise.all([
        getAllTagDefs(),
        getInstanceTagsForUser(uid),
      ]);

      // Build quick lookup from current system buckets
      const itemByInstance: Record<string, TagItem> = {};
      const sysBuckets = get().tags;
      for (const b of Object.values(sysBuckets)) {
        for (const [iid, item] of Object.entries(b)) if (!itemByInstance[iid]) itemByInstance[iid] = item;
      }

      const out: CustomTagsTree = { caught: {}, trade: {}, wanted: {} };

      // group memberships by tag_id
      const byTag = new Map<string, string[]>();
      for (const m of memberships) {
        if (m.user_id !== uid) continue;
        const arr = byTag.get(m.tag_id) || [];
        arr.push(m.instance_id);
        byTag.set(m.tag_id, arr);
      }

      for (const def of defs) {
        if (def.user_id !== uid || def.deleted_at) continue;
        if (!['caught','trade','wanted'].includes(def.parent as any)) continue;

        const instIds = byTag.get(def.tag_id) || [];
        const items: Record<string, TagItem> = {};
        for (const iid of instIds) if (itemByInstance[iid]) items[iid] = itemByInstance[iid];

        out[def.parent as ParentKind][def.tag_id] = { tag: def, items };
      }

      set({ customTags: out, customTagsLoading: false });
    } catch (e) {
      console.error('[TagsStore] rebuildCustomTags failed:', e);
      set({ customTags: { ...EMPTY_CUSTOM }, customTagsLoading: false });
    }
  },

  async buildTags() {
    const { variants, variantsLoading }   = useVariantsStore.getState();
    const { instances, instancesLoading } = useInstancesStore.getState();
    if (variantsLoading || instancesLoading) return;

    set({ tagsLoading: true });

    const newTags = initializePokemonTags(instances, variants);
    const sys     = computeSystemChildren(newTags);

    set({ tags: newTags, tagsLoading: false, systemChildren: sys });

    // keep lean snapshot for fast boot
    await setSystemChildrenSnapshot(toSnapshotIds(sys));

    if (PERSIST_SYSTEM_MEMBERSHIPS) {
      await persistSystemMembershipsFromBuckets(newTags).catch(() => {});
    }

    await get().rebuildCustomTags();
  },

  buildForeignTags(instances) {
    const { variants, variantsLoading } = useVariantsStore.getState();
    if (variantsLoading || !variants.length) return;
    set({ foreignTags: initializePokemonTags(instances, variants) });
  },

  async hydrateFromCache() {
    // We no longer depend on legacy per-bucket caches.
    // Strategy: use in-memory if ready; else fetch from IndexedDB (variants + instances),
    // then compute buckets and rehydrate children using snapshot ids.
    const tagsTS = Number(localStorage.getItem('tagsTimestamp') || 0); // optional; left for UX heuristics
    const ownTS  = Number(localStorage.getItem('ownershipTimestamp') || 0);
    const fresh       = !!tagsTS && isDataFresh(tagsTS);
    const needRebuild = ownTS > tagsTS;

    try {
      let variants = useVariantsStore.getState().variants;
      let instancesMap = useInstancesStore.getState().instances;

      if (!variants?.length) {
        variants = await getAllVariants<PokemonVariant>();
      }
      if (!Object.keys(instancesMap || {}).length) {
        const instArr = await getAllInstances<any>();
        instancesMap = (instArr || []).reduce((acc: any, row: any) => {
          if (row?.instance_id) acc[row.instance_id] = row;
          return acc;
        }, {} as Instances);
      }

      if (!variants?.length || !Object.keys(instancesMap || {}).length) {
        // Not enough data to hydrate; leave loading true and let buildTags() finish later
        return;
      }

      const buckets = initializePokemonTags(instancesMap, variants);
      const snap = await getSystemChildrenSnapshot();

      const sys = snap ? idsToChildren(snap, buckets) : computeSystemChildren(buckets);

      set({
        tags: buckets,
        systemChildren: sys,
        tagsLoading: false,
      });

      if (PERSIST_SYSTEM_MEMBERSHIPS) {
        await persistSystemMembershipsFromBuckets(buckets).catch(() => {});
      }

      // mark hydrated time
      localStorage.setItem('tagsTimestamp', Date.now().toString());

      // Optionally rebuild custom children once user id is known
      await get().rebuildCustomTags();
    } catch (e) {
      console.warn('[TagsStore] hydrateFromCache failed; will rebuild later:', e);
    }

    // If data was outdated, trigger a rebuild pass (non-blocking)
    if (!fresh || needRebuild) {
      await get().buildTags();
    }
  },

  refreshTags() {
    return get().buildTags();
  },

  resetTags() {
    set({
      tags: { ...EMPTY_BUCKETS },
      customTags: { ...EMPTY_CUSTOM },
      systemChildren: computeSystemChildren(EMPTY_BUCKETS),
      tagsLoading: true,
      customTagsLoading: true,
      foreignTags: null,
    });
    localStorage.removeItem('tagsTimestamp');
  },
}));

/* live lightweight rebuilds */
const quickRebuild = (instances: Instances, dest: 'tags' | 'foreignTags') => {
  const { variants, variantsLoading } = useVariantsStore.getState();
  if (variantsLoading || !variants.length) return;

  const buckets = initializePokemonTags(instances, variants);

  if (dest === 'tags') {
    const sys = computeSystemChildren(buckets);
    useTagsStore.setState({ tags: buckets, systemChildren: sys });
    setSystemChildrenSnapshot(toSnapshotIds(sys)).catch(() => {});
    if (PERSIST_SYSTEM_MEMBERSHIPS) persistSystemMembershipsFromBuckets(buckets).catch(() => {});
  } else {
    useTagsStore.setState({ foreignTags: buckets });
  }
};

useInstancesStore.subscribe((state) => {
  quickRebuild(state.instances, 'tags');
  useTagsStore.getState().rebuildCustomTags().catch(() => {});
});

useInstancesStore.subscribe((state) => {
  if (state.foreignInstances) quickRebuild(state.foreignInstances, 'foreignTags');
  else useTagsStore.setState({ foreignTags: null });
});
