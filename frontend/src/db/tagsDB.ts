// db/tagsDB.ts
/* -------------------------------------------------------------------------- */
/*  Tags IndexedDB helpers                                                    */
/* -------------------------------------------------------------------------- */

import { initTagsDB } from './init';
import {
  TAG_STORE_NAMES,
  TAG_DEFS_STORE,
  INSTANCE_TAGS_STORE,
} from './constants';

import type { TagItem } from '@/types/tags';

/** Literal union of the valid legacy tag stores */
export type TagStoreName = typeof TAG_STORE_NAMES[number];

/* ========================================================================== */
/*  NEW NORMALIZED TAG API (custom tags + memberships)                        */
/* ========================================================================== */

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

export interface InstanceTag {
  /** compound key `${tag_id}:${instance_id}` */
  key: string;
  tag_id: string;
  instance_id: string;
  user_id: string;
  created_at?: string | null;
}

/** Replace ALL tag definitions (authoritative snapshot). */
export async function replaceTagDefs(defs: TagDef[]): Promise<void> {
  const db = await initTagsDB();
  if (!db) return;
  const tx = db.transaction(TAG_DEFS_STORE, 'readwrite');
  await tx.store.clear();
  for (const d of defs) {
    await tx.store.put(d);
  }
  await tx.done;
}

export async function getAllTagDefs(): Promise<TagDef[]> {
  const db = await initTagsDB();
  if (!db) return [];
  return db.getAll(TAG_DEFS_STORE) as Promise<TagDef[]>;
}

export async function getTagDefsByParent(user_id: string, parent: ParentKind): Promise<TagDef[]> {
  const db = await initTagsDB();
  if (!db) return [];
  const tx = db.transaction(TAG_DEFS_STORE, 'readonly');
  const idx = tx.store.index('by_user_parent');
  const range = IDBKeyRange.only([user_id, parent]);
  const rows = await idx.getAll(range) as TagDef[];
  await tx.done;
  return rows;
}

/** Replace ALL instance-tag memberships (authoritative snapshot). */
export async function replaceInstanceTags(memberships: InstanceTag[]): Promise<void> {
  const db = await initTagsDB();
  if (!db) return;
  const tx = db.transaction(INSTANCE_TAGS_STORE, 'readwrite');
  await tx.store.clear();
  for (const m of memberships) {
    const key = m.key || `${m.tag_id}:${m.instance_id}`;
    await tx.store.put({ ...m, key });
  }
  await tx.done;
}

/** Add a single custom tag to an instance. Idempotent. */
export async function addInstanceTag(tag_id: string, instance_id: string, user_id: string): Promise<void> {
  const db = await initTagsDB();
  if (!db) return;
  const tx = db.transaction(INSTANCE_TAGS_STORE, 'readwrite');
  const key = `${tag_id}:${instance_id}`;
  await tx.store.put({ key, tag_id, instance_id, user_id, created_at: new Date().toISOString() } as InstanceTag);
  await tx.done;
}

/** Remove a single custom tag from an instance. */
export async function removeInstanceTag(tag_id: string, instance_id: string): Promise<void> {
  const db = await initTagsDB();
  if (!db) return;
  const tx = db.transaction(INSTANCE_TAGS_STORE, 'readwrite');
  const key = `${tag_id}:${instance_id}`;
  await tx.store.delete(key);
  await tx.done;
}

/** Get all instance_ids in a given custom tag. */
export async function getInstanceIdsByTag(tag_id: string): Promise<string[]> {
  const db = await initTagsDB();
  if (!db) return [];
  const tx = db.transaction(INSTANCE_TAGS_STORE, 'readonly');
  const idx = tx.store.index('by_tag');
  const rows = await idx.getAll(IDBKeyRange.only(tag_id)) as InstanceTag[];
  await tx.done;
  return rows.map(r => r.instance_id);
}

/** Get all tag_ids (custom) for a given instance. */
export async function getTagIdsByInstance(instance_id: string): Promise<string[]> {
  const db = await initTagsDB();
  if (!db) return [];
  const tx = db.transaction(INSTANCE_TAGS_STORE, 'readonly');
  const idx = tx.store.index('by_instance');
  const rows = await idx.getAll(IDBKeyRange.only(instance_id)) as InstanceTag[];
  await tx.done;
  return rows.map(r => r.tag_id);
}

/** Get all memberships for a user (useful for quick in-memory joins). */
export async function getInstanceTagsForUser(user_id: string): Promise<InstanceTag[]> {
  const db = await initTagsDB();
  if (!db) return [];
  const tx = db.transaction(INSTANCE_TAGS_STORE, 'readonly');
  const idx = tx.store.index('by_user');
  const rows = await idx.getAll(IDBKeyRange.only(user_id)) as InstanceTag[];
  await tx.done;
  return rows;
}

/* ========================================================================== */
/*  LEGACY per-bucket API (kept so existing code compiles/runs)               */
/* ========================================================================== */

export async function getFromTagsDB(
  storeName: TagStoreName,
  key: string,
): Promise<TagItem | null> {
  const db = await initTagsDB();
  return db ? (db.get(storeName, key) as Promise<TagItem | null>) : null;
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

  return items;
}

export async function clearTagsStore(storeName: TagStoreName): Promise<void> {
  const db = await initTagsDB();
  if (db) await db.clear(storeName);
}

export async function getAllTagsFromDB(): Promise<
  Record<TagStoreName, Record<string, TagItem>>
> {
  const db = await initTagsDB();
  if (!db) {
    console.warn('TagsDB not available; cannot read tags data.');
    return { caught: {}, wanted: {}, trade: {}, missing: {} } as Record<TagStoreName, Record<string, TagItem>>;
  }

  const tx  = db.transaction(TAG_STORE_NAMES, 'readonly');
  const out = { caught: {}, wanted: {}, trade: {}, missing: {} } as Record<TagStoreName, Record<string, TagItem>>;

  for (const store of TAG_STORE_NAMES) {
    const rows = await tx.objectStore(store).getAll() as TagItem[];
    for (const item of rows) {
      out[store][item.instance_id] = item;
    }
  }

  await tx.done;
  return out;
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

  for (const storeName of TAG_STORE_NAMES) {
    const store = tx.objectStore(storeName);
    await store.clear();

    const items = Object.keys(tagSets[storeName]).map<TagItem>((id) => ({
      ...tagSets[storeName][id],
      instance_id: id,
    }));

    for (const item of items) {
      await store.put(item);
    }
  }

  await tx.done;
}
