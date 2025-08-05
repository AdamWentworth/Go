// user.ts

/* -------------------------------------------------------------------------- */
/*  User + overview                                                           */
/* -------------------------------------------------------------------------- */

import type { PokemonInstance } from './pokemonInstance';
import type { Trade } from './trades';

/** A lightweight user record returned in the overview payload */
export interface User {
  user_id: string;
  username: string;
  // ← Add any profile fields you actually render in the UI
}

/** Shape of GET /api/users/:id/overview */
export interface UserOverview {
  user: User;
  pokemon_instances: Record<string, PokemonInstance>;
  trades: Record<string, Trade>;
  related_instances: Record<string, PokemonInstance>;
  registrations: Record<string, boolean>;
}
