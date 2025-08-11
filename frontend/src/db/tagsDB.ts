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
  version?: 1;
}

const SNAPSHOT_KEY = 'snapshot';

export async function setSystemChildrenSnapshot(
  snapshot: Omit<SystemChildrenIdsSnapshot, 'key'>
): Promise<void> {
  const db = await initTagsDB();
  if (!db) return;
  await db.put(SYSTEM_CHILDREN_STORE, { ...snapshot, key: SNAPSHOT_KEY, version: 1 });
}

export async function getSystemChildrenSnapshot(): Promise<SystemChildrenIdsSnapshot | null> {
  const db = await initTagsDB();
  if (!db) return null;

  const raw = (await db.get(SYSTEM_CHILDREN_STORE, SNAPSHOT_KEY)) as any;
  if (!raw) return null;
  if (raw.version === 1) return raw as SystemChildrenIdsSnapshot;

  const toIds = (obj: Record<string, unknown> | undefined) => obj ? Object.keys(obj) : [];
  const normalized: SystemChildrenIdsSnapshot = {
    caught_favorite_ids: toIds(raw?.caught_favorite),
    caught_trade_ids: toIds(raw?.caught_trade),
    wanted_mostWanted_ids: toIds(raw?.wanted_mostWanted),
    version: 1,
  };
  try { await setSystemChildrenSnapshot(normalized); } catch {}
  return normalized;
}

/* ---------- Normalized Tag API (no user_id anywhere) ---------- */

export type ParentKind = 'caught' | 'trade' | 'wanted';

export interface TagDef {
  tag_id: string;
  parent: ParentKind;  // which bucket this custom tag belongs under
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
  created_at?: string | null;
  tag_label?: string | null; // e.g., 'caught' | 'trade' | 'wanted' | 'favorite' | 'most_wanted'

  /** per-tag index placeholders (only set on rows for that tag) */
  caught_iid?: string | null;
  trade_iid?: string | null;
  wanted_iid?: string | null;
  favorite_iid?: string | null;
  most_wanted_iid?: string | null;
}

/* ---- tag defs ---- */

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

export async function getTagDefsByParent(parent: ParentKind): Promise<TagDef[]> {
  const db = await initTagsDB();
  if (!db) return [];
  try {
    const tx = db.transaction(TAG_DEFS_STORE, 'readonly');
    const idx = tx.store.index('by_parent');
    const rows = (await idx.getAll(parent)) as TagDef[];
    await tx.done;
    return rows;
  } catch {
    // index may not exist on first run; fall back to filtering all
    const all = await getAllTagDefs();
    return all.filter((d) => d.parent === parent);
  }
}

/* ---- instance tags ---- */

export async function replaceInstanceTags(memberships: InstanceTag[]): Promise<void> {
  const db = await initTagsDB();
  if (!db) return;
  const tx = db.transaction(INSTANCE_TAGS_STORE, 'readwrite');
  await tx.store.clear();
  for (const m of memberships) {
    const key = m.key || `${m.tag_id}:${m.instance_id}`;
    const payload = withPerTagIndexPlaceholders({ ...m, key });
    await tx.store.put(payload);
  }
  await tx.done;
}

export async function addInstanceTag(tag_id: string, instance_id: string, tag_label?: string): Promise<void> {
  const db = await initTagsDB();
  if (!db) return;
  const tx = db.transaction(INSTANCE_TAGS_STORE, 'readwrite');
  await tx.store.put(
    withPerTagIndexPlaceholders({
      key: `${tag_id}:${instance_id}`,
      tag_id, instance_id,
      tag_label: tag_label ?? null,
      created_at: new Date().toISOString(),
    } as InstanceTag)
  );
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
  const rows = (await tx.store.index('by_tag').getAll(tag_id)) as InstanceTag[];
  await tx.done;
  return rows.map((r) => r.instance_id);
}

/** ✅ true “index per system tag” on a single store (no user dimension) */
export async function getInstanceIdsBySystemTag(
  label: 'caught' | 'trade' | 'wanted' | 'favorite' | 'most_wanted'
): Promise<string[]> {
  const db = await initTagsDB();
  if (!db) return [];
  const tx = db.transaction(INSTANCE_TAGS_STORE, 'readonly');

  const indexName =
    label === 'caught'      ? 'by_caught' :
    label === 'trade'       ? 'by_trade' :
    label === 'wanted'      ? 'by_wanted' :
    label === 'favorite'    ? 'by_favorite' :
                              'by_most_wanted';

  const idx = tx.store.index(indexName);
  const rows = (await idx.getAll()) as InstanceTag[];
  await tx.done;

  // Only rows for that tag have the *_iid field set; map to instance_id
  return rows.map(r => r.instance_id);
}

export async function getTagIdsByInstance(instance_id: string): Promise<string[]> {
  const db = await initTagsDB();
  if (!db) return [];
  const tx = db.transaction(INSTANCE_TAGS_STORE, 'readonly');
  const rows = (await tx.store.index('by_instance').getAll(instance_id)) as InstanceTag[];
  await tx.done;
  return rows.map((r) => r.tag_id);
}

export async function getAllInstanceTags(): Promise<InstanceTag[]> {
  const db = await initTagsDB();
  if (!db) return [];
  return db.getAll(INSTANCE_TAGS_STORE) as Promise<InstanceTag[]>;
}

/** Mirror system buckets into instanceTags (no user markers) */
export async function persistSystemMembershipsFromBuckets(buckets: TagBuckets): Promise<void> {
  const db = await initTagsDB();
  if (!db) return;

  const tx = db.transaction(INSTANCE_TAGS_STORE, 'readwrite');
  const store = tx.objectStore(INSTANCE_TAGS_STORE);

  // wipe prior generated rows for system labels
  const wipeFor = async (label: string) => {
    try {
      const rows = (await store.index('by_tag').getAll(label)) as InstanceTag[];
      for (const row of rows) await store.delete(row.key);
    } catch {}
  };
  await Promise.all(['caught','wanted','favorite','most_wanted','trade'].map(wipeFor));

  const putMany = (label: 'caught' | 'wanted' | 'favorite' | 'most_wanted' | 'trade', ids: string[]) => {
    for (const instance_id of ids) {
      store.put(withPerTagIndexPlaceholders({
        key: `${label}:${instance_id}`,
        tag_id: label,
        instance_id,
        tag_label: label,
        created_at: new Date().toISOString(),
      }));
    }
  };

  // parents
  putMany('caught', Object.keys(buckets.caught));
  putMany('wanted', Object.keys(buckets.wanted));

  // children (derived only)
  const favoriteIds = Object.entries(buckets.caught)
    .filter(([, item]) => (item as any).favorite)
    .map(([id]) => id);

  const tradeIds = Object.entries(buckets.caught)  // ✅ from CAUGHT only
    .filter(([, item]) => (item as any).is_for_trade)
    .map(([id]) => id);

  const mostWantedIds = Object.entries(buckets.wanted)
    .filter(([, item]) => (item as any).most_wanted)
    .map(([id]) => id);

  putMany('favorite',     favoriteIds);
  putMany('trade',        tradeIds);        // ✅ child label, not a parent
  putMany('most_wanted',  mostWantedIds);

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

/* ---------- helpers ---------- */

function withPerTagIndexPlaceholders(m: InstanceTag): InstanceTag {
  const label = (m.tag_label || m.tag_id || '').toLowerCase();

  const payload: InstanceTag = { ...m };
  payload.caught_iid       = label === 'caught'       ? m.instance_id : null;
  payload.trade_iid        = label === 'trade'        ? m.instance_id : null;
  payload.wanted_iid       = label === 'wanted'       ? m.instance_id : null;
  payload.favorite_iid     = label === 'favorite'     ? m.instance_id : null;
  payload.most_wanted_iid  = label === 'most_wanted'  ? m.instance_id : null;

  return payload;
}
