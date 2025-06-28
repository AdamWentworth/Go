/* ------------------------------------------------------------------ */
/*  src/features/tags/store/useTagsStore.ts                           */
/* ------------------------------------------------------------------ */

import { create } from 'zustand';

import {
  getAllListsFromDB,
  storeListsInIndexedDB,
} from '@/db/indexedDB';

import { initializePokemonTags } from '../utils/initializePokemonTags';
import { coerceToTagBuckets }   from '@/features/tags/utils/tagHelpers';
import { isDataFresh }          from '@/utils/cacheHelpers';
import { formatTimeAgo }        from '@/utils/formattingHelpers';

import { useVariantsStore }   from '@/features/variants/store/useVariantsStore';
import { useInstancesStore }  from '@/features/instances/store/useInstancesStore';

import type { TagBuckets, TagBucketsDB } from '@/types/tags';
import type { Instances }                from '@/types/instances';

/* ================================================================== */
/*  Store definition                                                  */
/* ================================================================== */

interface TagsStore {
  tags            : TagBuckets;
  tagsLoading     : boolean;
  buildTags       : () => Promise<void>;   // heavy – persists to IDB / SW
  refreshTags     : () => Promise<void>;
  resetTags       : () => void;
  hydrateFromCache: () => Promise<void>;

  /* foreign‑user view */
  foreignTags     : TagBuckets | null;
  buildForeignTags: (instances: Instances) => void;
}

export const useTagsStore = create<TagsStore>()((set, get) => ({
  /* -------------------------------------------------------------- */
  /* state                                                          */
  /* -------------------------------------------------------------- */
  tags       : { owned: {}, trade: {}, wanted: {}, unowned: {} },
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
  
    // 🚀 save for next launch (optional, fast)
    const dbReady: TagBucketsDB = Object.fromEntries(
      Object.entries(newTags).map(([bucket, rec]) => [
        bucket,
        Object.fromEntries(
          Object.entries(rec).map(([id, item]) => [
            id,
            { ...item, instance_id: id },
          ]),
        ),
      ]),
    );
    await storeListsInIndexedDB(dbReady);
    localStorage.setItem('listsTimestamp', Date.now().toString());
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
    const tagsTS = Number(localStorage.getItem('listsTimestamp')   || 0);
    const ownTS  = Number(localStorage.getItem('ownershipTimestamp') || 0);
    const fresh       = tagsTS && isDataFresh(tagsTS);
    const needRebuild = ownTS  > tagsTS;

    if (fresh && !needRebuild) {
      console.log('[TagsStore] Hydrating tags from IndexedDB…');
      const cached   = await getAllListsFromDB();
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
      tags       : { owned: {}, trade: {}, wanted: {}, unowned: {} },
      tagsLoading: true,
      foreignTags: null,
    });
    localStorage.removeItem('listsTimestamp');
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
/* fires on every change to `instances`                              */
useInstancesStore.subscribe((state) => {
  quickRebuild(state.instances, 'tags');
});

/* ---- foreign‑user collections ----------------------------------- */
/* fires on every change to `foreignInstances`                       */
useInstancesStore.subscribe((state) => {
  if (state.foreignInstances) {
    quickRebuild(state.foreignInstances, 'foreignTags');
  } else {
    // clear when leaving a foreign profile
    useTagsStore.setState({ foreignTags: null });
  }
});

