// user.ts

/* -------------------------------------------------------------------------- */
/*  User + overview                                                           */
/* -------------------------------------------------------------------------- */

import type { PokemonInstance } from './pokemonInstance';
import type { Trade } from './trades';
import type {
  UserOverview as SharedUserOverview,
  UserOverviewUser,
} from '@shared-contracts/users';

/** A lightweight user record returned in the overview payload */
export type User = UserOverviewUser;

/** Shape of GET /api/users/:id/overview */
export type UserOverview = SharedUserOverview<
  PokemonInstance,
  Trade,
  PokemonInstance,
  boolean
>;
