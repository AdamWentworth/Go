import * as Crypto from 'expo-crypto';
import type {
  PokemonInstance,
  WantedSizePreferences,
} from '@pokemongonexus/shared-contracts/instances';
import type { NativeCollectionSnapshot } from '../../services/collectionApi';
import type { NativeReceiverApiClient } from '../../services/nativeApiClients';
import type { nativeCollectionOutbox } from '../../storage/nativeCollectionOutbox';
import { sendPendingNativeCollectionBatches } from './collectionSyncCoordinator';
import {
  createNativeCollectionMutation,
  type NativeCollectionMutation,
} from './collectionMutationModel';

type CollectionOutboxPort = Pick<
  typeof nativeCollectionOutbox,
  'queue' | 'list' | 'markAttemptFailed' | 'markAcknowledged' | 'removeAcknowledged'
>;

export type NativeInstanceDetailPatch = Partial<Pick<
  PokemonInstance,
  | 'attack_iv'
  | 'charged_move1_id'
  | 'charged_move2_id'
  | 'cp'
  | 'date_caught'
  | 'defense_iv'
  | 'fast_move_id'
  | 'favorite'
  | 'friendship_level'
  | 'gender'
  | 'height'
  | 'level'
  | 'location_card'
  | 'location_caught'
  | 'most_wanted'
  | 'nickname'
  | 'pref_lucky'
  | 'stamina_iv'
  | 'wanted_size_preferences'
  | 'weight'
>>;

const assertNullableFinite = (
  label: string,
  value: number | null | undefined,
  minimum: number,
  maximum: number,
): void => {
  if (value == null) return;
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new Error(`${label} must be between ${minimum} and ${maximum}.`);
  }
};

const assertNullableInteger = (
  label: string,
  value: number | null | undefined,
  minimum: number,
  maximum: number,
): void => {
  assertNullableFinite(label, value, minimum, maximum);
  if (value != null && !Number.isInteger(value)) {
    throw new Error(`${label} must be a whole number.`);
  }
};

const normalizeNullableText = (value: string | null | undefined): string | null | undefined => {
  if (value === undefined || value === null) return value;
  const normalized = value.trim();
  return normalized || null;
};

const normalizeWantedSizePreferences = (
  value: WantedSizePreferences | null | undefined,
): WantedSizePreferences | null | undefined => {
  if (value === undefined || value === null) return value;
  const categories = new Set(['XXS', 'XS', 'XL', 'XXL']);
  for (const [label, range] of Object.entries(value)) {
    if (!range) continue;
    if (!categories.has(range.category)) throw new Error(`${label} size preference is invalid.`);
    if (range.min != null && !Number.isFinite(range.min)) throw new Error(`${label} minimum is invalid.`);
    if (range.max != null && !Number.isFinite(range.max)) throw new Error(`${label} maximum is invalid.`);
  }
  return value;
};

export const normalizeNativeInstanceDetailPatch = (
  patch: NativeInstanceDetailPatch,
): NativeInstanceDetailPatch => {
  assertNullableInteger('CP', patch.cp, 10, 100_000);
  assertNullableFinite('Level', patch.level, 1, 51);
  if (patch.level != null && Math.round(patch.level * 2) !== patch.level * 2) {
    throw new Error('Level must use half-level steps.');
  }
  assertNullableInteger('Attack IV', patch.attack_iv, 0, 15);
  assertNullableInteger('Defense IV', patch.defense_iv, 0, 15);
  assertNullableInteger('HP IV', patch.stamina_iv, 0, 15);
  assertNullableFinite('Weight', patch.weight, 0, 100_000);
  assertNullableFinite('Height', patch.height, 0, 10_000);
  assertNullableInteger('Friendship', patch.friendship_level, 0, 5);
  assertNullableInteger('Fast move', patch.fast_move_id, 1, Number.MAX_SAFE_INTEGER);
  assertNullableInteger('Charged move', patch.charged_move1_id, 1, Number.MAX_SAFE_INTEGER);
  assertNullableInteger('Second charged move', patch.charged_move2_id, 1, Number.MAX_SAFE_INTEGER);

  const nickname = normalizeNullableText(patch.nickname);
  if (nickname && nickname.length > 64) throw new Error('Nickname must be 64 characters or fewer.');
  const gender = normalizeNullableText(patch.gender);
  if (gender && !['Male', 'Female', 'Genderless'].includes(gender)) {
    throw new Error('Gender selection is invalid.');
  }

  return {
    ...patch,
    nickname,
    gender,
    location_card: normalizeNullableText(patch.location_card),
    location_caught: normalizeNullableText(patch.location_caught),
    date_caught: normalizeNullableText(patch.date_caught),
    wanted_size_preferences: normalizeWantedSizePreferences(patch.wanted_size_preferences),
  };
};

export const persistNativeInstanceDetailMutation = async ({
  userId,
  snapshot,
  requestedInstanceId,
  patch,
  outbox,
  receiverClient,
  onQueued,
  syncBatchId = Crypto.randomUUID(),
  now = Date.now(),
}: {
  userId: string;
  snapshot: NativeCollectionSnapshot;
  requestedInstanceId: string;
  patch: NativeInstanceDetailPatch;
  outbox: CollectionOutboxPort;
  receiverClient: Pick<NativeReceiverApiClient, 'post'>;
  onQueued?: (mutation: NativeCollectionMutation) => Promise<void> | void;
  syncBatchId?: string;
  now?: number;
}) => {
  const mutation = createNativeCollectionMutation({
    instances: snapshot.instances,
    requestedInstanceId,
    patch: normalizeNativeInstanceDetailPatch(patch),
    syncBatchId,
    now,
  });
  await outbox.queue(userId, mutation.batch, now);
  await onQueued?.(mutation);
  const sent = await sendPendingNativeCollectionBatches({ userId, outbox, receiverClient });
  return {
    mutation,
    syncState: sent.failedBatchId ? 'pending' as const : 'acknowledged' as const,
    message: sent.failedBatchId
      ? 'Details saved on this device. They will sync when Receiver is available.'
      : 'Pokémon details saved. Receiver accepted the update.',
  };
};
