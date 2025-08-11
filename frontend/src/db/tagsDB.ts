// db/tagsDB.ts
import { initTagsDB } from './init';
import {
  TAG_DEFS_STORE,
  INSTANCE_TAGS_STORE,
  SYSTEM_CHILDREN_STORE,
} from './constants';

import type { TagBuckets } from '@/types/tags';

/* ---------- System Children Snapshot (ids only) ---------- */

export interface SystemChildrenIdsSnapshot {
  key?: 'snapshot';
  caught_favorite_ids: string[];
  caught_trade_ids: string[];
  wanted_mostWanted_ids: string[];
  version?: 2;
}

const SNAPSHOT_KEY = 'snapshot';

export async function setSystemChildrenSnapshot(
  snapshot: Omit<SystemChildrenIdsSnapshot, 'key'>
): Promise<void> {
  const db = await initTagsDB();
  if (!db) return;
  await db.put(SYSTEM_CHILDREN_STORE, { ...snapshot, key: SNAPSHOT_KEY, version: 2 });
}

export async function getSystemChildrenSnapshot(): Promise<SystemChildrenIdsSnapshot | null> {
  const db = await initTagsDB();
  if (!db) return null;

  const raw = (await db.get(SYSTEM_CHILDREN_STORE, SNAPSHOT_KEY)) as any;
  if (!raw) return null;
  if (raw.version === 2) return raw as SystemChildrenIdsSnapshot;

  const toIds = (obj: Record<string, unknown> | undefined) => obj ? Object.keys(obj) : [];
  const normalized: SystemChildrenIdsSnapshot = {
    caught_favorite_ids: toIds(raw?.caught_favorite),
    caught_trade_ids: toIds(raw?.caught_trade),
    wanted_mostWanted_ids: toIds(raw?.wanted_mostWanted),
    version: 2,
  };
  try { await setSystemChildrenSnapshot(normalized); } catch {}
  return normalized;
}

/* ---------- Normalized Tag API ---------- */

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
  key: string; // `${tag_id}:${instance_id}`
  tag_id: string;
  instance_id: string;
  user_id: string; // 'sys' for system memberships; actual user for custom
  created_at?: string | null;
  tag_label?: string | null; // for DevTools readability
}

export async function replaceTagDefs(defs: TagDef[]): Promise<void> {
  const db = await initTagsDB();
  if (!db) return;
  const tx = db.transaction(TAG_DEFS_STORE, 'readwrite');
  await tx.store.clear();
  for (const d of defs) await tx.store.put(d);
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
  const rows = (await idx.getAll(IDBKeyRange.only([user_id, parent]))) as TagDef[];
  await tx.done;
  return rows;
}

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

export async function addInstanceTag(tag_id: string, instance_id: string, user_id: string, tag_label?: string): Promise<void> {
  const db = await initTagsDB();
  if (!db) return;
  const tx = db.transaction(INSTANCE_TAGS_STORE, 'readwrite');
  await tx.store.put({
    key: `${tag_id}:${instance_id}`,
    tag_id, instance_id, user_id,
    tag_label: tag_label ?? null,
    created_at: new Date().toISOString(),
  } as InstanceTag);
  await tx.done;
}

export async function removeInstanceTag(tag_id: string, instance_id: string): Promise<void> {
  const db = await initTagsDB();
  if (!db) return;
  const tx = db.transaction(INSTANCE_TAGS_STORE, 'readwrite');
  await tx.store.delete(`${tag_id}:${instance_id}`);
  await tx.done;
}

export async function getInstanceIdsByTag(tag_id: string): Promise<string[]> {
  const db = await initTagsDB();
  if (!db) return [];
  const tx = db.transaction(INSTANCE_TAGS_STORE, 'readonly');
  const rows = (await tx.store.index('by_tag').getAll(IDBKeyRange.only(tag_id))) as InstanceTag[];
  await tx.done;
  return rows.map((r) => r.instance_id);
}

export async function getTagIdsByInstance(instance_id: string): Promise<string[]> {
  const db = await initTagsDB();
  if (!db) return [];
  const tx = db.transaction(INSTANCE_TAGS_STORE, 'readonly');
  const rows = (await tx.store.index('by_instance').getAll(IDBKeyRange.only(instance_id))) as InstanceTag[];
  await tx.done;
  return rows.map((r) => r.tag_id);
}

export async function getInstanceTagsForUser(user_id: string): Promise<InstanceTag[]> {
  const db = await initTagsDB();
  if (!db) return [];
  const tx = db.transaction(INSTANCE_TAGS_STORE, 'readonly');
  const rows = (await tx.store.index('by_user').getAll(IDBKeyRange.only(user_id))) as InstanceTag[];
  await tx.done;
  return rows;
}

/** Optional: mirror system buckets into instanceTags with user_id='sys' so DevTools has rows to inspect. */
export async function persistSystemMembershipsFromBuckets(buckets: TagBuckets): Promise<void> {
  const db = await initTagsDB();
  if (!db) return;

  const tx = db.transaction(INSTANCE_TAGS_STORE, 'readwrite');
  const store = tx.objectStore(INSTANCE_TAGS_STORE);

  // wipe previous sys rows
  try {
    const existing = (await store.index('by_user').getAll(IDBKeyRange.only('sys'))) as InstanceTag[];
    for (const row of existing) await store.delete(row.key);
  } catch {}

  const putMany = (tagId: string, ids: string[]) => {
    for (const instance_id of ids) {
      store.put({
        key: `${tagId}:${instance_id}`,
        tag_id: tagId,
        instance_id,
        user_id: 'sys',
        tag_label: tagId,
        created_at: new Date().toISOString(),
      } as InstanceTag);
    }
  };

  putMany('caught', Object.keys(buckets.caught));
  putMany('trade', Object.keys(buckets.trade));
  putMany('wanted', Object.keys(buckets.wanted));

  const favoriteIds = Object.entries(buckets.caught)
    .filter(([, item]) => (item as any).favorite)
    .map(([id]) => id);
  const mostWantedIds = Object.entries(buckets.wanted)
    .filter(([, item]) => (item as any).most_wanted)
    .map(([id]) => id);

  putMany('favorite', favoriteIds);
  putMany('most_wanted', mostWantedIds);

  await tx.done;
}

export async function clearAllTagsDB(): Promise<void> {
  const db = await initTagsDB();
  if (!db) return;

  const tx = db.transaction(
    [TAG_DEFS_STORE, INSTANCE_TAGS_STORE, SYSTEM_CHILDREN_STORE],
    'readwrite'
  );
  await tx.objectStore(TAG_DEFS_STORE).clear();
  await tx.objectStore(INSTANCE_TAGS_STORE).clear();
  await tx.objectStore(SYSTEM_CHILDREN_STORE).clear();
  await tx.done;
}