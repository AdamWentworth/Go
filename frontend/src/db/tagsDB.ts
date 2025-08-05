// db/tagsDB.ts
/* -------------------------------------------------------------------------- */
/*  Tags IndexedDB helpers                                                    */
/* -------------------------------------------------------------------------- */

import { initTagsDB }       from './init';
import { TAG_STORE_NAMES }  from './constants';
import type { TagItem }     from '@/types/tags';

/** Literal union of the valid tag stores */
export type TagStoreName = typeof TAG_STORE_NAMES[number];

/* -------------------------------------------------------------------------- */
/*  Single‑store helpers                                                      */
/* -------------------------------------------------------------------------- */

export async function getFromTagsDB(
  storeName: TagStoreName,
  key: string,
): Promise<TagItem | null> {
  const db = await initTagsDB();
  return db ? db.get(storeName, key) : null;
}

export async function putIntoTagsDB(
  storeName: TagStoreName,
  data: TagItem,
): Promise<void> {
  const db = await initTagsDB();
  if (db) await db.put(storeName, data);
}

export async function getAllFromTagsDB(
  storeName: TagStoreName,
): Promise<TagItem[]> {
  const db = await initTagsDB();
  if (!db) {
    console.warn('TagsDB not available; cannot read data.');
    return [];
  }

  const tx    = db.transaction(storeName, 'readonly');
  const items = await tx.objectStore(storeName).getAll() as TagItem[];
  await tx.done;

  try {
    const bytes = new Blob([JSON.stringify(items)]).size;
    console.log(
      `getAllFromTagsDB: Retrieved ${items.length} items from '${storeName}' (~${bytes} bytes)`,
    );
  } catch { /* size estimate failed – ignore */ }

  return items;
}

export async function clearTagsStore(storeName: TagStoreName): Promise<void> {
  const db = await initTagsDB();
  if (db) await db.clear(storeName);
}

/* -------------------------------------------------------------------------- */
/*  Multi‑store helpers                                                       */
/* -------------------------------------------------------------------------- */

export async function getAllTagsFromDB(): Promise<
  Record<TagStoreName, Record<string, TagItem>>
> {
  const db = await initTagsDB();
  if (!db) {
    console.warn('TagsDB not available; cannot read tags data.');
    return { caught: {}, wanted: {}, trade: {}, missing: {} } as Record<TagStoreName, Record<string, TagItem>>;
  }

  const tx = db.transaction(TAG_STORE_NAMES, 'readonly');
  const tagSets: Record<TagStoreName, Record<string, TagItem>> = {
    caught: {}, wanted: {}, trade: {}, missing: {},
  } as Record<TagStoreName, Record<string, TagItem>>;

  await Promise.all(
    TAG_STORE_NAMES.map(async (storeName) => {
      const storeItems = await tx.objectStore(storeName).getAll() as TagItem[];
      storeItems.forEach((item) => {
        tagSets[storeName][item.instance_id] = item;
      });
    }),
  );

  await tx.done;

  try {
    const bytes = new Blob([JSON.stringify(tagSets)]).size;
    console.log(`getAllTagsFromDB: Combined tags size: ${bytes} bytes`);
  } catch { /* ignore */ }

  return tagSets;
}

export async function storeTagsInIndexedDB(
  tagSets: Record<TagStoreName, Record<string, TagItem>>,
): Promise<void> {
  const db = await initTagsDB();
  if (!db) {
    console.warn('TagsDB not available; cannot store tags data.');
    return;
  }

  const tx = db.transaction(TAG_STORE_NAMES, 'readwrite');

  try {
    const bytes = new Blob([JSON.stringify(tagSets)]).size;
    console.log(
      `storeTagsInIndexedDB: Storing ${Object.keys(tagSets).length} tag sets (${bytes} bytes)`,
    );
  } catch { /* ignore */ }

  await Promise.all(
    TAG_STORE_NAMES.map(async (storeName) => {
      const store = tx.objectStore(storeName);
      await store.clear();

      const items = Object.keys(tagSets[storeName]).map<TagItem>((id) => ({
        ...tagSets[storeName][id],
        instance_id: id,
      }));

      for (const item of items) {
        await store.put(item);
      }
    }),
  );

  await tx.done;
}
