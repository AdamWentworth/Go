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
};

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
    autocompleteTrainers: (query: string) =>
      `/autocomplete-trainers?q=${encodeURIComponent(query)}`,
    updateUser: (userId: string) =>
      `/update-user/${encodeURIComponent(userId)}`,
    userOverview: (userId: string) =>
      `/users/${encodeURIComponent(userId)}/overview`,
  },
} as const;
