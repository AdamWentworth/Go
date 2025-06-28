// db/listsDB.ts

import { initListsDB } from './init';
import { LIST_STORES } from './constants';
import type { TagItem } from '@/types/tags';

export async function getFromListsDB(storeName: string, key: string): Promise<TagItem | null> {
  const db = await initListsDB();
  if (!db) return null;
  return db.get(storeName, key);
}

export async function putIntoListsDB(storeName: string, data: TagItem): Promise<void> {
  const db = await initListsDB();
  if (!db) return;
  await db.put(storeName, data);
}

export async function getAllFromListsDB(storeName: string): Promise<TagItem[]> {
  const db = await initListsDB();
  if (!db) {
    console.warn("ListsDB not available; cannot read data.");
    return [];
  }
  const tx = db.transaction(storeName, 'readonly');
  const store = tx.objectStore(storeName);
  const allData: TagItem[] = await store.getAll();
  await tx.done;
  try {
    const allDataSize: number = new Blob([JSON.stringify(allData)]).size;
    console.log(
      `getAllFromListsDB: Retrieved ${allData.length} items from '${storeName}' (approx size: ${allDataSize} bytes)`
    );
  } catch (err) {
    console.log(`Error measuring size in getAllFromListsDB for store '${storeName}':`, err);
  }
  return allData;
}

export async function clearListsStore(storeName: string): Promise<void> {
  const db = await initListsDB();
  if (!db) return;
  await db.clear(storeName);
}

export async function getAllListsFromDB(): Promise<{ [storeName: string]: Record<string, TagItem> }> {
  const db = await initListsDB();
  if (!db) {
    console.warn("ListsDB not available; cannot read lists data.");
    return {};
  }
  const tx = db.transaction(LIST_STORES, 'readonly');
  const lists: { [storeName: string]: Record<string, TagItem> } = {};
  await Promise.all(
    LIST_STORES.map(async (storeName: string): Promise<void> => {
      const store = tx.objectStore(storeName);
      const itemsArray: TagItem[] = await store.getAll();
      const itemsObject: Record<string, TagItem> = {};
      for (const item of itemsArray) {
        itemsObject[item.instance_id] = item;
      }
      lists[storeName] = itemsObject;
    })
  );
  await tx.done;
  try {
    const listsSize: number = new Blob([JSON.stringify(lists)]).size;
    console.log(`getAllListsFromDB: Combined lists size: ${listsSize} bytes`);
  } catch (err) {
    console.log('Error measuring combined lists size in getAllListsFromDB:', err);
  }
  return lists;
}

export async function storeListsInIndexedDB(
  lists: { [storeName: string]: Record<string, TagItem> }
): Promise<void> {
  const db = await initListsDB();
  if (!db) {
    console.warn("ListsDB not available; cannot store lists data.");
    return;
  }
  const tx = db.transaction(LIST_STORES, 'readwrite');
  try {
    const listsSize: number = new Blob([JSON.stringify(lists)]).size;
    const keysCount: number = Object.keys(lists).length;
    console.log(
      `storeListsInIndexedDB: Storing lists with ${keysCount} keys, total size: ${listsSize} bytes`
    );
  } catch (err) {
    console.log('Error measuring size in storeListsInIndexedDB:', err);
  }
  await Promise.all(
    LIST_STORES.map(async (listName: string): Promise<void> => {
      const store = tx.objectStore(listName);
      await store.clear();
      const list = lists[listName];
      const itemsArray: TagItem[] = Object.keys(list).map((instance_id: string) => {
        return { ...list[instance_id], instance_id };
      });
      for (const item of itemsArray) {
        await store.put(item);
      }
    })
  );
  await tx.done;
}
