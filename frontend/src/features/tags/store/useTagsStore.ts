// src/features/tags/store/useTagsStore.ts

import { create } from 'zustand';

import {
  getAllTagDefs,
  getAllInstanceTags,
  persistSystemMembershipsFromBuckets,
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

import type { TagBuckets, TagItem } from '@/types/tags';
import type { Instances }           from '@/types/instances';
import type { PokemonVariant }      from '@/types/pokemonVariants';
import type { TagDef }              from '@/db/tagsDB';

/* ------------ Types for custom tag tree (NO trade parent) ------------ */

export interface CustomTagBucket {
  tag: TagDef;
  items: Record<string, TagItem>;
}

export interface CustomTagsTree {
  caught: Record<string, CustomTagBucket>;
  wanted: Record<string, CustomTagBucket>;
}

/* ------------ System children (computed) ------------ */

export interface SystemChildren {
  caught: { favorite: Record<string, TagItem>; trade: Record<string, TagItem>; };
  wanted: { mostWanted: Record<string, TagItem>; };
}

// We keep TagBuckets.trade in memory for backward-compat,
// but we DO NOT treat it as a parent or read it to compute children/UI.
const EMPTY_BUCKETS: TagBuckets = { caught: {}, wanted: {}, trade: {} };
const EMPTY_CUSTOM  : CustomTagsTree = { caught: {}, wanted: {} };

function computeSystemChildren(tags: TagBuckets): SystemChildren {
  const favorite   : Record<string, TagItem> = {};
  const tradeChild : Record<string, TagItem> = {};
  const mostWanted : Record<string, TagItem> = {};

  // Favorite + Trade strictly from CAUGHT
  for (const [id, item] of Object.entries(tags.caught)) {
    if ((item as any).favorite)     favorite[id]   = item;
    if ((item as any).is_for_trade) tradeChild[id] = item;
  }

  // Most Wanted strictly from WANTED
  for (const [id, item] of Object.entries(tags.wanted)) {
    if ((item as any).most_wanted) mostWanted[id] = item;
  }

  return { caught: { favorite, trade: tradeChild }, wanted: { mostWanted } };
}

function toSnapshotIds(sys: SystemChildren): SystemChildrenIdsSnapshot {
  return {
    caught_favorite_ids   : Object.keys(sys.caught.favorite),
    caught_trade_ids      : Object.keys(sys.caught.trade),
    wanted_mostWanted_ids : Object.keys(sys.wanted.mostWanted),
    version: 1,
  };
}

function idsToChildren(snap: SystemChildrenIdsSnapshot, buckets: TagBuckets): SystemChildren {
  const pick = (ids: string[], src: Record<string, TagItem>) => {
    const out: Record<string, TagItem> = {};
    for (const id of ids) if (src[id]) out[id] = src[id];
    return out;
  };

  // Rehydrate purely from their parent buckets
  return {
    caught: {
      favorite: pick(snap.caught_favorite_ids, buckets.caught),
      trade   : pick(snap.caught_trade_ids,    buckets.caught),
    },
    wanted: {
      mostWanted: pick(snap.wanted_mostWanted_ids, buckets.wanted),
    },
  };
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

  rebuildCustomTags(): Promise<void>;
}

export const useTagsStore = create<TagsStore>()((set, get) => ({
  tags             : { ...EMPTY_BUCKETS },
  customTags       : { ...EMPTY_CUSTOM },
  systemChildren   : computeSystemChildren(EMPTY_BUCKETS),
  tagsLoading      : true,
  customTagsLoading: true,
  foreignTags      : null,

  async rebuildCustomTags() {
    const { variants, variantsLoading }   = useVariantsStore.getState();
    const { instances, instancesLoading } = useInstancesStore.getState();
    if (variantsLoading || instancesLoading) return;

    set({ customTagsLoading: true });

    try {
      const [defs, memberships] = await Promise.all([
        getAllTagDefs(),
        getAllInstanceTags(),
      ]);

      // quick lookup from system buckets
      const itemByInstance: Record<string, TagItem> = {};
      const sysBuckets = get().tags;
      for (const b of Object.values(sysBuckets)) {
        for (const [iid, item] of Object.entries(b)) if (!itemByInstance[iid]) itemByInstance[iid] = item;
      }

      const out: CustomTagsTree = { caught: {}, wanted: {} };

      // group memberships by tag_id
      const byTag = new Map<string, string[]>();
      for (const m of memberships) {
        const arr = byTag.get(m.tag_id) || [];
        arr.push(m.instance_id);
        byTag.set(m.tag_id, arr);
      }

      for (const def of defs) {
        if (def.deleted_at) continue;

        // Only allow 'caught' | 'wanted' as parents (Trade is NOT a parent)
        const parent: 'caught' | 'wanted' | null =
          def.parent === 'caught' ? 'caught'
        : def.parent === 'wanted' ? 'wanted'
        : null;
        if (!parent) continue; // ignore any legacy 'trade' parents

        const instIds = byTag.get(def.tag_id) || [];
        const items: Record<string, TagItem> = {};
        for (const iid of instIds) if (itemByInstance[iid]) items[iid] = itemByInstance[iid];

        out[parent][def.tag_id] = { tag: def, items };
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

    await setSystemChildrenSnapshot(toSnapshotIds(sys));

    // Mirrors derived children (favorites, caught▸trade, most_wanted).
    await persistSystemMembershipsFromBuckets(newTags).catch(() => {});

    await get().rebuildCustomTags();
  },

  buildForeignTags(instances) {
    const { variants, variantsLoading } = useVariantsStore.getState();
    if (variantsLoading || !variants.length) return;
    set({ foreignTags: initializePokemonTags(instances, variants) });
  },

  async hydrateFromCache() {
    const tagsTS = Number(localStorage.getItem('tagsTimestamp') || 0);
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

      await persistSystemMembershipsFromBuckets(buckets).catch(() => {});

      localStorage.setItem('tagsTimestamp', Date.now().toString());

      await get().rebuildCustomTags();
    } catch (e) {
      console.warn('[TagsStore] hydrateFromCache failed; will rebuild later:', e);
    }

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
    persistSystemMembershipsFromBuckets(buckets).catch(() => {});
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
