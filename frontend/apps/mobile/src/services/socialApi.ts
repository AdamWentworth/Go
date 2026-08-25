import type { PokemonInstance } from '@pokemongonexus/shared-contracts/instances';
import type { TrainerProfile } from '@pokemongonexus/shared-contracts/users';
import { usersContract } from '@pokemongonexus/shared-contracts/users';
import type { NativeUsersApiClient } from './nativeApiClients';

type SocialClient = Pick<NativeUsersApiClient, 'get'>;

const isRecord = (value: unknown): value is Record<string, unknown> => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const isFiniteNumber = (value: unknown): value is number => (
  typeof value === 'number' && Number.isFinite(value)
);

const isTrainerProfile = (value: unknown): value is TrainerProfile<PokemonInstance> => {
  if (!isRecord(value) || !isRecord(value.user) || !isRecord(value.stats) || !isRecord(value.viewer)) {
    return false;
  }
  return typeof value.user.user_id === 'string'
    && typeof value.user.username === 'string'
    && typeof value.user.app_joined_at === 'string'
    && isFiniteNumber(value.stats.caught)
    && isFiniteNumber(value.stats.for_trade)
    && isFiniteNumber(value.stats.wanted)
    && isFiniteNumber(value.stats.favorites)
    && isFiniteNumber(value.stats.registered)
    && Array.isArray(value.trainer_titles)
    && Array.isArray(value.highlights)
    && typeof value.viewer.relationship === 'string'
    && typeof value.viewer.can_view_profile === 'boolean'
    && typeof value.viewer.can_view_collection === 'boolean';
};

export const getNativeTrainerProfile = async (
  usersClient: SocialClient,
  username?: string | null,
): Promise<TrainerProfile<PokemonInstance>> => {
  const normalizedUsername = username?.trim();
  const path = normalizedUsername
    ? usersContract.endpoints.profileByUsername(normalizedUsername)
    : usersContract.endpoints.profile;
  const payload = await usersClient.get<unknown>(path);
  if (!isTrainerProfile(payload)) {
    throw new Error('The trainer profile response is invalid.');
  }
  return payload;
};
