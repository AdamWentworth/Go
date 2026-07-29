import {
  deleteAcknowledgedPokemonUpdates,
  getAcknowledgedPokemonUpdates,
  getBatchedPokemonUpdates,
} from '@/db/indexedDB';
import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import {
  buildUrl,
  parseJsonSafe,
  requestWithPolicy,
  toHttpError,
} from '@/services/httpClient';
import {
  getStorageString,
  setStorageString,
  STORAGE_KEYS,
} from '@/utils/storage';
import { usersContract } from '@shared-contracts/users';
import type { InstanceSyncEnvelope } from '@shared-contracts/users';
import type { Instances } from '@/types/instances';

const USERS_API_URL = import.meta.env.VITE_USERS_API_URL;

export async function reconcileInstancesFromServer(): Promise<boolean> {
  const checkpoint = getStorageString(STORAGE_KEYS.ownershipCheckpoint) ?? '';
  const url = buildUrl(
    USERS_API_URL,
    usersContract.endpoints.instanceSync,
    checkpoint ? { checkpoint } : undefined,
  );
  const response = await requestWithPolicy(url, { method: 'GET' });
  const body = await parseJsonSafe<InstanceSyncEnvelope<Instances[string]>>(response);
  if (!response.ok || !body) {
    throw toHttpError(response.status, body);
  }
  if (body.not_modified || !body.instances) {
    setStorageString(STORAGE_KEYS.ownershipCheckpoint, body.checkpoint);
    return false;
  }

  const [pending, acknowledged] = await Promise.all([
    getBatchedPokemonUpdates(),
    getAcknowledgedPokemonUpdates(),
  ]);
  const reconciled: Instances = { ...body.instances };
  const confirmedAcknowledgedIDs: string[] = [];
  for (const update of acknowledged) {
    const serverLastUpdate = Number(reconciled[update.instance_id]?.last_update ?? 0);
    const localLastUpdate = Number(update.last_update ?? 0);
    const isDeletion = !update.is_caught && !update.is_for_trade && !update.is_wanted;
    if (serverLastUpdate >= localLastUpdate || (isDeletion && !reconciled[update.instance_id])) {
      confirmedAcknowledgedIDs.push(update.instance_id);
    }
  }
  for (const update of [...acknowledged, ...pending]) {
    const instanceID = update.instance_id;
    const serverLastUpdate = Number(reconciled[instanceID]?.last_update ?? 0);
    const localLastUpdate = Number(update.last_update ?? 0);
    if (localLastUpdate <= serverLastUpdate) continue;

    const isTracked = Boolean(
      update.is_caught || update.is_for_trade || update.is_wanted,
    );
    if (!isTracked) {
      delete reconciled[instanceID];
    } else {
      reconciled[instanceID] = {
        ...reconciled[instanceID],
        ...update,
        instance_id: instanceID,
      } as Instances[string];
    }
  }
  await useInstancesStore.getState().replaceInstances(reconciled);
  await deleteAcknowledgedPokemonUpdates(confirmedAcknowledgedIDs);
  setStorageString(STORAGE_KEYS.ownershipCheckpoint, body.checkpoint);
  return true;
}
