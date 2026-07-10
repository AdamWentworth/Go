// db/registrationsDB.ts
import { initRegistrationsDB } from './init';
import { MANUAL_POKEDEX_REGISTRATIONS_STORE, REGISTRATIONS_STORE } from './constants';

import type { PokedexRegistrationEntry } from '@/features/pokedex/registrationProjection';

export interface RegistrationEntry {
  variant_id: string;
  registered_at: string;           // ISO string
}

export async function putRegistrations(entries: RegistrationEntry[]): Promise<void> {
  const db = await initRegistrationsDB();
  if (!db) return;

  const tx = db.transaction(REGISTRATIONS_STORE, 'readwrite');
  const s  = tx.objectStore(REGISTRATIONS_STORE);
  entries.forEach(e => s.put(e));
  await tx.done;
}

export async function getRegistrations(): Promise<RegistrationEntry[]> {
  const db = await initRegistrationsDB();
  return db ? (db.getAll(REGISTRATIONS_STORE) as Promise<RegistrationEntry[]>) : [];
}

export async function putManualPokedexRegistrations(
  entries: PokedexRegistrationEntry[],
): Promise<void> {
  const db = await initRegistrationsDB();
  if (!db) return;

  const tx = db.transaction(MANUAL_POKEDEX_REGISTRATIONS_STORE, 'readwrite');
  const store = tx.objectStore(MANUAL_POKEDEX_REGISTRATIONS_STORE);
  entries.forEach((entry) => store.put(entry));
  await tx.done;
}

export async function deleteManualPokedexRegistrations(
  registrationIds: string[],
): Promise<void> {
  const db = await initRegistrationsDB();
  if (!db) return;

  const tx = db.transaction(MANUAL_POKEDEX_REGISTRATIONS_STORE, 'readwrite');
  const store = tx.objectStore(MANUAL_POKEDEX_REGISTRATIONS_STORE);
  registrationIds.forEach((registrationId) => store.delete(registrationId));
  await tx.done;
}

export async function getManualPokedexRegistrations(): Promise<PokedexRegistrationEntry[]> {
  const db = await initRegistrationsDB();
  return db
    ? (db.getAll(MANUAL_POKEDEX_REGISTRATIONS_STORE) as Promise<PokedexRegistrationEntry[]>)
    : [];
}

export async function clearManualPokedexRegistrations(): Promise<void> {
  const db = await initRegistrationsDB();
  if (!db) return;

  await db.clear(MANUAL_POKEDEX_REGISTRATIONS_STORE);
}
