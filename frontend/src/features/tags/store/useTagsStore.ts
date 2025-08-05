/* ------------------------------------------------------------------ */
/*  src/features/tags/store/useTagsStore.ts                           */
/* ------------------------------------------------------------------ */

import { create } from 'zustand';

import {
  getAllTagsFromDB,
  storeTagsInIndexedDB,
} from '@/db/tagsDB';

import { TAG_STORE_NAMES } from '@/db/constants';

import { initializePokemonTags } from '../utils/initializePokemonTags';
import { coerceToTagBuckets }   from '@/features/tags/utils/tagHelpers';
import { isDataFresh }          from '@/utils/cacheHelpers';

import { useVariantsStore }   from '@/features/variants/store/useVariantsStore';
import { useInstancesStore }  from '@/features/instances/store/useInstancesStore';

import type { TagBuckets, TagItem } from '@/types/tags';
import type { Instances }           from '@/types/instances';

/**
 * Derive TagStoreName union directly from the runtime array so we only have
 * one single source-of-truth.
 */
type TagStoreName = typeof TAG_STORE_NAMES[number];

/* ================================================================== */
/*  Helpers                                                           */
/* ================================================================== */

const EMPTY_BUCKETS: TagBuckets = {
  caught : {},
  missing: {},
  wanted : {},
  trade  : {},
};

const toDBShape = (
  buckets: TagBuckets,
): Record<TagStoreName, Record<string, TagItem>> => {
  return TAG_STORE_NAMES.reduce((acc, bucketName) => {
    // ensure every store has *some* object—even if empty
    acc[bucketName] = buckets[bucketName] ?? {};
    return acc;
  }, {} as Record<TagStoreName, Record<string, TagItem>>);
};

/* ================================================================== */
/*  Store definition                                                  */
/* ================================================================== */

interface TagsStore {
  /* state */
  tags        : TagBuckets;
  tagsLoading : boolean;
  foreignTags : TagBuckets | null;

  /* actions */
  buildTags       (): Promise<void>;   // heavy – persists to IndexedDB
  refreshTags     (): Promise<void>;
  resetTags       (): void;
  hydrateFromCache(): Promise<void>;
  buildForeignTags(instances: Instances): void;
}

export const useTagsStore = create<TagsStore>()((set, get) => ({
  /* -------------------------------------------------------------- */
  /* state                                                          */
  /* -------------------------------------------------------------- */
  tags       : { ...EMPTY_BUCKETS },
  tagsLoading: true,
  foreignTags: null,

  /* -------------------------------------------------------------- */
  /* heavy rebuilds (startup, manual refresh)                       */
  /* -------------------------------------------------------------- */

  async buildTags() {
    const { variants, variantsLoading }   = useVariantsStore.getState();
    const { instances, instancesLoading } = useInstancesStore.getState();
    if (variantsLoading || instancesLoading) return;

    console.log('[TagsStore] Rebuilding tags from live data…');
    set({ tagsLoading: true });

    const newTags = initializePokemonTags(instances, variants);
    set({ tags: newTags, tagsLoading: false });

    await storeTagsInIndexedDB(toDBShape(newTags));
    localStorage.setItem('tagsTimestamp', Date.now().toString());
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
      console.log('[TagsStore] Hydrating tags from IndexedDB…');
      const cached   = await getAllTagsFromDB();
      const hydrated = coerceToTagBuckets(cached);
      set({ tags: hydrated, tagsLoading: false });
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
      tags       : { ...EMPTY_BUCKETS },
      tagsLoading: true,
      foreignTags: null,
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
  useTagsStore.setState({ [dest]: buckets } as Partial<TagsStore>);
};

/* ---- own collection --------------------------------------------- */
useInstancesStore.subscribe((state) => {
  quickRebuild(state.instances, 'tags');
});

/* ---- foreign-user collections ----------------------------------- */
useInstancesStore.subscribe((state) => {
  if (state.foreignInstances) {
    quickRebuild(state.foreignInstances, 'foreignTags');
  } else {
    useTagsStore.setState({ foreignTags: null });
  }
});