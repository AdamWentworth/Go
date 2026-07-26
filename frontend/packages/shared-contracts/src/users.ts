export type UserInstancesEnvelope<TInstances = Record<string, unknown>> = {
  username?: string;
  user?: {
    username?: string;
  };
  instances?: TInstances;
};

export interface UserOverviewUser {
  user_id: string;
  username: string;
  [key: string]: unknown;
}

export interface UserOverview<
  TPokemonInstance = Record<string, unknown>,
  TTrade = Record<string, unknown>,
  TRelatedInstance = TPokemonInstance,
  TRegistration = boolean,
> {
  user: UserOverviewUser;
  pokemon_instances: Record<string, TPokemonInstance>;
  trades: Record<string, TTrade>;
  related_instances: Record<string, TRelatedInstance>;
  registrations: Record<string, TRegistration>;
}

export type TrainerAutocompleteEntry = {
  username: string;
  pokemonGoName?: string | null;
  team?: string | null;
  trainer_level?: number | null;
};

export type ProfileVisibility = 'public' | 'friends' | 'private';
export type FriendRequestPermission = 'everyone' | 'nobody';
export type TrainerCodeVisibility = 'public' | 'friends' | 'private';
export type TrainerRelationship =
  | 'none'
  | 'self'
  | 'friend'
  | 'incoming'
  | 'outgoing'
  | 'blocked';

export interface TrainerPreferences {
  user_id: string;
  bio?: string | null;
  profile_visibility: ProfileVisibility;
  collection_visibility: ProfileVisibility;
  friend_request_permission: FriendRequestPermission;
  trainer_code_visibility: TrainerCodeVisibility;
  show_location: boolean;
  show_pokemon_go_name: boolean;
  updated_at?: string;
}

export interface TrainerProfileUser {
  user_id: string;
  username: string;
  pokemonGoName?: string | null;
  team?: string | null;
  trainer_level?: number | null;
  total_xp?: number | null;
  pogo_started_on?: string | null;
  app_joined_at: string;
}

export interface TrainerProfileStats {
  caught: number;
  for_trade: number;
  wanted: number;
  favorites: number;
  registered: number;
}

export interface TrainerProfile<TInstance = Record<string, unknown>> {
  user: TrainerProfileUser;
  bio?: string | null;
  location?: string | null;
  trainer_code?: string | null;
  stats: TrainerProfileStats;
  highlights: TInstance[];
  preferences?: TrainerPreferences;
  viewer: {
    relationship: TrainerRelationship;
    friendship_id?: string | null;
    can_view_profile: boolean;
    can_view_collection: boolean;
  };
}

export interface FriendSummary {
  user_id: string;
  username: string;
  pokemonGoName?: string | null;
  team?: string | null;
  trainer_level?: number | null;
  friendship_id: string;
  direction?: 'accepted' | 'incoming' | 'outgoing' | 'blocked';
}

export interface FriendsOverview {
  friends: FriendSummary[];
  incoming: FriendSummary[];
  outgoing: FriendSummary[];
  blocked: FriendSummary[];
}

export interface UpdateTrainerProfileRequest {
  pokemonGoName?: string;
  trainer_code?: string;
  team?: string;
  trainer_level?: number;
  total_xp?: number;
  pogo_started_on?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  bio?: string;
  highlight_instance_ids?: string[];
}

export type UpdateTrainerPreferencesRequest = Omit<
  TrainerPreferences,
  'user_id' | 'bio' | 'updated_at'
>;

export type ForeignInstancesFetchOutcome<
  TInstances = Record<string, unknown>,
> =
  | {
      type: 'success';
      username: string;
      instances: TInstances;
      etag: string | null;
    }
  | { type: 'notModified' }
  | { type: 'notFound' }
  | { type: 'forbidden' }
  | { type: 'error'; status: number; statusText: string };

export type TrainerAutocompleteOutcome =
  | { type: 'success'; results: TrainerAutocompleteEntry[] }
  | { type: 'error'; message: string; status?: number };

export interface SecondaryUserUpdateRequest {
  username: string;
  latitude?: number;
  longitude?: number;
  pokemonGoName?: string;
}

export type ErrorEnvelope = {
  message?: string;
};

const toLower = (value: string) => value.toLowerCase();

export const usersContract = {
  endpoints: {
    instancesByUsername: (username: string) =>
      `/instances/by-username/${encodeURIComponent(toLower(username))}`,
    publicUserByUsername: (username: string) =>
      `/public/users/${encodeURIComponent(toLower(username))}`,
    profileByUsername: (username: string) =>
      `/profiles/${encodeURIComponent(toLower(username))}`,
    autocompleteTrainers: (query: string) =>
      `/autocomplete-trainers?q=${encodeURIComponent(query)}`,
    updateUser: (userId: string) =>
      `/update-user/${encodeURIComponent(userId)}`,
    userOverview: (userId: string) =>
      `/users/${encodeURIComponent(userId)}/overview`,
    profile: '/profile',
    preferences: '/preferences',
    friends: '/friends',
    friendRequests: '/friends/requests',
    acceptFriendRequest: (friendshipId: string) =>
      `/friends/requests/${encodeURIComponent(friendshipId)}/accept`,
    friendRequest: (friendshipId: string) =>
      `/friends/requests/${encodeURIComponent(friendshipId)}`,
    friend: (userId: string) =>
      `/friends/${encodeURIComponent(userId)}`,
    friendBlocks: '/friends/blocks',
    friendBlock: (userId: string) =>
      `/friends/blocks/${encodeURIComponent(userId)}`,
  },
} as const;
