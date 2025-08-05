// db/registrationsDB.ts
import { initRegistrationsDB } from './init';
import { REGISTRATIONS_STORE } from './constants';

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
