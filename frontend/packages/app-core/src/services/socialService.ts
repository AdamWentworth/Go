import type { PokemonInstance } from '@/types/pokemonInstance';
import {
  buildUrl,
  parseJsonSafe,
  requestWithPolicy,
  toHttpError,
} from '@/services/httpClient';
import type {
  FriendsOverview,
  TrainerProfile,
  TrainerPreferences,
  UpdateTrainerPreferencesRequest,
  UpdateTrainerProfileRequest,
} from '@shared-contracts/users';
import { usersContract } from '@shared-contracts/users';

const USERS_API_URL = import.meta.env.VITE_USERS_API_URL;

const endpoint = (path: string) => buildUrl(USERS_API_URL, path);

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await requestWithPolicy(endpoint(path), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  const body = await parseJsonSafe<T & { message?: string }>(response);
  if (!response.ok || !body) {
    throw toHttpError(response.status, body);
  }
  return body;
}

export const fetchTrainerProfile = (username: string) =>
  requestJson<TrainerProfile<PokemonInstance>>(
    usersContract.endpoints.profileByUsername(username),
  );

export const fetchOwnTrainerProfile = () =>
  requestJson<TrainerProfile<PokemonInstance>>(usersContract.endpoints.profile);

export const updateTrainerProfile = (profile: UpdateTrainerProfileRequest) =>
  requestJson<{ success: boolean }>(usersContract.endpoints.profile, {
    method: 'PUT',
    body: JSON.stringify(profile),
  });

export const fetchTrainerPreferences = () =>
  requestJson<TrainerPreferences>(usersContract.endpoints.preferences);

export const updateTrainerPreferences = (
  preferences: UpdateTrainerPreferencesRequest,
) =>
  requestJson<TrainerPreferences>(usersContract.endpoints.preferences, {
    method: 'PUT',
    body: JSON.stringify(preferences),
  });

export const fetchFriendsOverview = () =>
  requestJson<FriendsOverview>(usersContract.endpoints.friends);

export const sendFriendRequest = (username: string) =>
  requestJson<{ friendship_id: string }>(
    usersContract.endpoints.friendRequests,
    {
      method: 'POST',
      body: JSON.stringify({ username }),
    },
  );

export const acceptFriendRequest = (friendshipId: string) =>
  requestJson<{ success: boolean }>(
    usersContract.endpoints.acceptFriendRequest(friendshipId),
    { method: 'POST' },
  );

export async function deleteFriendRequest(friendshipId: string): Promise<void> {
  const response = await requestWithPolicy(
    endpoint(usersContract.endpoints.friendRequest(friendshipId)),
    { method: 'DELETE' },
  );
  if (!response.ok && response.status !== 204) {
    throw toHttpError(response.status, await parseJsonSafe(response));
  }
}

export async function removeFriend(userId: string): Promise<void> {
  const response = await requestWithPolicy(
    endpoint(usersContract.endpoints.friend(userId)),
    { method: 'DELETE' },
  );
  if (!response.ok && response.status !== 204) {
    throw toHttpError(response.status, await parseJsonSafe(response));
  }
}

export const blockTrainer = (userId: string) =>
  requestJson<{ success: boolean }>(usersContract.endpoints.friendBlocks, {
    method: 'POST',
    body: JSON.stringify({ user_id: userId }),
  });

export async function unblockTrainer(userId: string): Promise<void> {
  const response = await requestWithPolicy(
    endpoint(usersContract.endpoints.friendBlock(userId)),
    { method: 'DELETE' },
  );
  if (!response.ok && response.status !== 204) {
    throw toHttpError(response.status, await parseJsonSafe(response));
  }
}
