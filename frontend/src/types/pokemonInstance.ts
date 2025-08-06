// src/types/pokemonInstance.ts
/* -------------------------------------------------------------------------- */
/*  Pokémon instance - canonical                                              */
/* -------------------------------------------------------------------------- */

export interface PokemonInstance {
  /* identity -------------------------------------------------------------- */
  instance_id?: string;          // map-key when sent from backend
  variant_id: string;
  pokemon_id: number;
  nickname: string | null;

  /* stats & IVs ------------------------------------------------------------ */
  cp: number | null;
  level: number | null;
  attack_iv: number | null;
  defense_iv: number | null;
  stamina_iv: number | null;

  /* appearance / forms ----------------------------------------------------- */
  shiny: boolean;
  costume_id: number | null;

  /* shadow / purification state ------------------------------------------- */
  lucky: boolean;
  shadow: boolean;
  purified: boolean;

  /* moves ------------------------------------------------------------------ */
  fast_move_id: number | null;
  charged_move1_id: number | null;
  charged_move2_id: number | null;

  /* physical attributes ---------------------------------------------------- */
  weight: number | null;
  height: number | null;
  gender: string | null;

  /* mega / dynamax / crown ------------------------------------------------- */
  mega: boolean;
  mega_form: string | null;
  is_mega: boolean;              // keep boolean; initialize to false
  dynamax: boolean;
  gigantamax: boolean;
  crown: boolean;
  max_attack: number | null;
  max_guard: number | null;
  max_spirit: number | null;

  /* fusion ----------------------------------------------------------------- */
  is_fused: boolean;
  fusion: Record<string, unknown> | null;
  fusion_form: string | null;
  fused_with: string | null;

  /* provenance / trade flags ---------------------------------------------- */
  is_traded: boolean;
  traded_date: string | null;
  original_trainer_id: string | null;
  original_trainer_name: string | null;

  /* ownership state & tags ------------------------------------------------- */
  is_caught: boolean;
  is_for_trade: boolean;
  is_wanted: boolean;
  most_wanted: boolean;
  caught_tags: string[] | null;
  trade_tags: string[] | null;
  wanted_tags: string[] | null;
  not_trade_list: Record<string, unknown> | null;
  not_wanted_list: Record<string, unknown> | null;
  trade_filters: Record<string, unknown> | null;
  wanted_filters: Record<string, unknown> | null;

  /* misc flags ------------------------------------------------------------- */
  mirror: boolean;
  pref_lucky: boolean;
  registered: boolean;
  favorite: boolean;
  disabled: boolean;

  /* timestamps & location -------------------------------------------------- */
  pokeball: string | null;
  location_card: string | null;
  location_caught: string | null;
  date_caught: string | null;
  date_added: string;            // ISO 8601
  last_update: number;           // epoch ms (standardize on number)

  /* optional convenience props used only by the client -------------------- */
  pokemonKey?: string;           // legacy
  username?: string;
  gps?: string | null;

  /* allow arbitrary extensions -------------------------------------------- */
  [key: string]: unknown;
}
