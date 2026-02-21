export type UserInstancesEnvelope<TInstances = Record<string, unknown>> = {
  username?: string;
  user?: {
    username?: string;
  };
  instances?: TInstances;
};

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
