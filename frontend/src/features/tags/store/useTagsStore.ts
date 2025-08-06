/* ------------------------------------------------------------------ */
/*  src/features/tags/store/useTagsStore.ts                           */
/* ------------------------------------------------------------------ */

import { create } from 'zustand';

import {
  // legacy cache (system buckets)
  getAllTagsFromDB,
  storeTagsInIndexedDB,
  // normalized custom tags
  getAllTagDefs,
  getInstanceTagsForUser,
  type TagDef,
} from '@/db/tagsDB';

import { TAG_STORE_NAMES } from '@/db/constants';

import { initializePokemonTags } from '../utils/initializePokemonTags';
import { coerceToTagBuckets }   from '@/features/tags/utils/tagHelpers';
import { isDataFresh }          from '@/utils/cacheHelpers';

import { useVariantsStore }   from '@/features/variants/store/useVariantsStore';
import { useInstancesStore }  from '@/features/instances/store/useInstancesStore';
import { useAuthStore }       from '@/stores/useAuthStore';

import type { TagBuckets, TagItem } from '@/types/tags';
import type { Instances }           from '@/types/instances';
import type { PokemonVariant }      from '@/types/pokemonVariants';

/**
 * Derive TagStoreName union directly from the runtime array so we only have
 * one single source-of-truth.
 */
type TagStoreName = typeof TAG_STORE_NAMES[number];

/* ================================================================== */
/*  Types for custom tag tree                                         */
/* ================================================================== */

export type ParentKind = 'caught' | 'trade' | 'wanted';

export interface CustomTagBucket {
  tag: TagDef;
  items: Record<string /* instance_id */, TagItem>;
}

export interface CustomTagsTree {
  caught: Record<string /* tag_id */, CustomTagBucket>;
  trade : Record<string /* tag_id */, CustomTagBucket>;
  wanted: Record<string /* tag_id */, CustomTagBucket>;
}

/* ================================================================== */
/*  Helpers                                                           */
/* ================================================================== */

const EMPTY_BUCKETS: TagBuckets = {
  caught : {},
  missing: {},
  wanted : {},
  trade  : {},
};

const EMPTY_CUSTOM: CustomTagsTree = {
  caught: {},
  trade : {},
  wanted: {},
};

const toDBShape = (
  buckets: TagBuckets,
): Record<TagStoreName, Record<string, TagItem>> => {
  return TAG_STORE_NAMES.reduce((acc, bucketName) => {
    acc[bucketName] = buckets[bucketName] ?? {};
    return acc;
  }, {} as Record<TagStoreName, Record<string, TagItem>>);
};

function buildIndexByVariant(variants: PokemonVariant[]) {
  const byKey = new Map<string, PokemonVariant>();
  for (const v of variants) {
    byKey.set(v.variant_id, v);
  }
  return byKey;
}

/* ================================================================== */
/*  Store definition                                                  */
/* ================================================================== */

interface TagsStore {
  /* state */
  tags             : TagBuckets;       // system buckets
  customTags       : CustomTagsTree;   // children per system parent
  tagsLoading      : boolean;
  customTagsLoading: boolean;
  foreignTags      : TagBuckets | null;

  /* actions */
  buildTags       (): Promise<void>;   // heavy – persists system buckets to IndexedDB
  refreshTags     (): Promise<void>;
  resetTags       (): void;
  hydrateFromCache(): Promise<void>;
  buildForeignTags(instances: Instances): void;

  /* internal helpers */
  rebuildCustomTags(userId?: string): Promise<void>;
}

export const useTagsStore = create<TagsStore>()((set, get) => ({
  /* -------------------------------------------------------------- */
  /* state                                                          */
  /* -------------------------------------------------------------- */
  tags             : { ...EMPTY_BUCKETS },
  customTags       : { ...EMPTY_CUSTOM },
  tagsLoading      : true,
  customTagsLoading: true,
  foreignTags      : null,

  /* -------------------------------------------------------------- */
  /* heavy rebuilds (startup, manual refresh)                       */
  /* -------------------------------------------------------------- */

  async rebuildCustomTags(userId) {
    const { variants, variantsLoading }   = useVariantsStore.getState();
    const { instances, instancesLoading } = useInstancesStore.getState();
    if (variantsLoading || instancesLoading) return;

    const uid = userId ?? (useAuthStore.getState().user?.user_id ?? '');
    if (!uid) {
      // No user id yet—treat as empty; UI can retry later
      set({ customTags: { ...EMPTY_CUSTOM }, customTagsLoading: false });
      return;
    }

    set({ customTagsLoading: true });

    try {
      const [defs, memberships] = await Promise.all([
        getAllTagDefs(),
        getInstanceTagsForUser(uid),
      ]);

      // Group memberships by tag_id
      const byTagId = new Map<string, string[]>(); // tag_id -> instance_ids
      for (const m of memberships) {
        if (m.user_id !== uid) continue;
        const arr = byTagId.get(m.tag_id) || [];
        arr.push(m.instance_id);
        byTagId.set(m.tag_id, arr);
      }

      // Build lookup tables
      const byVariant = buildIndexByVariant(variants);
      const systemBuckets = initializePokemonTags(instances, variants); // reuse builder for TagItem creation
      // We'll use its TagItem builder logic for consistent visuals
      // but we still need to compute TagItems for arbitrary instance ids:
      const toTagItem = (instanceId: string): TagItem | null => {
        const inst = (instances as any)[instanceId];
        if (!inst) return null;
        const v = byVariant.get(inst.variant_id);
        if (!v) return null;

        // Reuse the same calculation as initializePokemonTags via tagHelpers.buildTagItem
        // but importing it directly here would cause a circular dep for some setups.
        // So we mimic the minimal fields utilized by TagItem. We will import the builder.
        return null; // Placeholder, replaced by batch below
      };

      // We will rebuild TagItems by leveraging systemBuckets (since it already computed items for every instance)
      // Build a quick flat lookup: instance_id -> TagItem (pick from any bucket)
      const itemByInstance: Record<string, TagItem> = {};
      for (const b of Object.values(systemBuckets)) {
        for (const [iid, item] of Object.entries(b)) {
          if (!itemByInstance[iid]) itemByInstance[iid] = item;
        }
      }

      const out: CustomTagsTree = { caught: {}, trade: {}, wanted: {} };
      for (const def of defs) {
        if (def.user_id !== uid) continue;
        if (def.deleted_at) continue;
        if (!['caught', 'trade', 'wanted'].includes(def.parent as any)) continue;

        const instIds = byTagId.get(def.tag_id) || [];
        const items: Record<string, TagItem> = {};
        for (const iid of instIds) {
          const item = itemByInstance[iid];
          if (item) items[iid] = item;
        }

        const parentKey = def.parent as ParentKind;
        out[parentKey][def.tag_id] = { tag: def, items };
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

    console.log('[TagsStore] Rebuilding tags from live data…');
    set({ tagsLoading: true });

    const newTags = initializePokemonTags(instances, variants);
    set({ tags: newTags, tagsLoading: false });

    // Persist system buckets (legacy cache) for quick startup
    await storeTagsInIndexedDB(toDBShape(newTags));
    localStorage.setItem('tagsTimestamp', Date.now().toString());

    // Also rebuild custom children once system buckets are ready
    await get().rebuildCustomTags();
  },

  /** Build buckets for a *foreign* user once. */
  buildForeignTags(instances) {
    const { variants, variantsLoading } = useVariantsStore.getState();
    if (variantsLoading || !variants.length) return;

    const newTags = initializePokemonTags(instances, variants);
    set({ foreignTags: newTags });
  },

  /** Hydrate from cache or rebuild if stale. */
  async hydrateFromCache() {
    const tagsTS = Number(localStorage.getItem('tagsTimestamp') || 0);
    const ownTS  = Number(localStorage.getItem('ownershipTimestamp') || 0);
    const fresh       = !!tagsTS && isDataFresh(tagsTS);
    const needRebuild = ownTS > tagsTS;

    if (fresh && !needRebuild) {
      console.log('[TagsStore] Hydrating tags from IndexedDB (system buckets)…');
      const cached   = await getAllTagsFromDB();
      const hydrated = coerceToTagBuckets(cached);
      set({ tags: hydrated, tagsLoading: false });
      // Custom children are normalized; rebuild them on the fly
      await get().rebuildCustomTags();
    } else {
      console.log('[TagsStore] Tags stale or outdated — rebuilding.');
      await get().buildTags();
    }
  },

  refreshTags() {
    return get().buildTags();
  },

  resetTags() {
    set({
      tags             : { ...EMPTY_BUCKETS },
      customTags       : { ...EMPTY_CUSTOM },
      tagsLoading      : true,
      customTagsLoading: true,
      foreignTags      : null,
    });
    localStorage.removeItem('tagsTimestamp');
  },
}));

/* ------------------------------------------------------------------ */
/*  ✨  LIVE  ✨  lightweight rebuilds                                 */
/* ------------------------------------------------------------------ */

const quickRebuild = (instances: Instances, dest: 'tags' | 'foreignTags') => {
  const { variants, variantsLoading } = useVariantsStore.getState();
  if (variantsLoading || !variants.length) return;

  const buckets = initializePokemonTags(instances, variants);
  useTagsStore.setState({ [dest]: buckets } as Partial<ReturnType<typeof useTagsStore.getState>>);
};

// ---- own collection ------------------------------------------------
useInstancesStore.subscribe((state) => {
  quickRebuild(state.instances, 'tags');
  // custom tags depend on TagItem details (cp, flags…) -> rebuild children too
  useTagsStore.getState().rebuildCustomTags().catch((e) =>
    console.warn('[TagsStore] custom quick rebuild skipped:', e)
  );
});

// ---- foreign-user collections -------------------------------------
useInstancesStore.subscribe((state) => {
  if (state.foreignInstances) {
    quickRebuild(state.foreignInstances, 'foreignTags');
  } else {
    useTagsStore.setState({ foreignTags: null });
  }
});
